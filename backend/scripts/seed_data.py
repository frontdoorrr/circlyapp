#!/usr/bin/env python3
"""Seed local UX test data.

Creates:
- the documented mock user (test@example.com)
- 5 circles that include the mock user
- 10 dummy selectable users per circle
- 5 active polls per circle
- votes on every poll (varied participation, hearts to the mock user, inbox notifications)

Run with: uv run python scripts/seed_data.py

Note: Run seed_templates.py first to ensure poll templates exist.
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.core.enums import MemberRole, NotificationType, PollStatus, UserRole
from app.core.security import generate_invite_code, generate_voter_hash
from app.modules.auth.models import User
from app.modules.circles.models import Circle, CircleMember
from app.modules.notifications.models import Notification
from app.modules.polls.models import Poll, PollTemplate, Vote
from app.modules.reports.models import Report  # noqa: F401

MOCK_USER = {
    "email": "test@example.com",
    "username": "mock_user",
    "display_name": "테스트 유저",
    "profile_emoji": "🧪",
}

CIRCLE_NAMES = [
    ("2학년 3반", "쉬는 시간마다 모이는 반 친구들"),
    ("축구부", "운동장 끝나고도 계속 이야기하는 팀"),
    ("스터디 크루", "시험 기간에 서로 끌어주는 모임"),
    ("방과후 친구들", "하교 후 같이 노는 친구들"),
    ("급식 메이트", "점심시간 고정 멤버"),
]

MEMBER_NAMES = [
    ("김민준", "😎"),
    ("이서연", "✨"),
    ("박지우", "🌟"),
    ("최현우", "🔥"),
    ("정유나", "🎀"),
    ("한서준", "⚡"),
    ("강민지", "🌸"),
    ("오준혁", "🎮"),
    ("신은지", "📚"),
    ("문태양", "☀️"),
]

QUESTIONS_PER_CIRCLE = 5
MEMBERS_PER_CIRCLE = 10


async def get_or_create_user(
    session: AsyncSession,
    *,
    email: str,
    username: str,
    display_name: str,
    profile_emoji: str,
    supabase_user_id: str | None = None,
) -> User:
    """Get a user by email or create it."""
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is not None:
        updated = False
        if user.username is None:
            user.username = username
            updated = True
        if user.display_name is None:
            user.display_name = display_name
            updated = True
        if supabase_user_id and user.supabase_user_id is None:
            user.supabase_user_id = supabase_user_id
            updated = True
        if updated:
            await session.commit()
            await session.refresh(user)
        return user

    user = User(
        email=email,
        supabase_user_id=supabase_user_id,
        username=username,
        display_name=display_name,
        profile_emoji=profile_emoji,
        role=UserRole.USER,
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def seed_users(session: AsyncSession) -> tuple[User, dict[int, list[User]]]:
    """Create the mock user and 10 dedicated dummy users for each circle."""
    mock_user = await get_or_create_user(
        session,
        email=MOCK_USER["email"],
        username=MOCK_USER["username"],
        display_name=MOCK_USER["display_name"],
        profile_emoji=MOCK_USER["profile_emoji"],
        supabase_user_id=f"dev:{MOCK_USER['email']}",
    )

    users_by_circle: dict[int, list[User]] = {}
    created_count = 0

    for circle_index in range(len(CIRCLE_NAMES)):
        circle_users: list[User] = []
        for member_index, (display_name, emoji) in enumerate(MEMBER_NAMES, start=1):
            email = f"seed-c{circle_index + 1}-u{member_index}@example.com"
            result = await session.execute(select(User).where(User.email == email))
            existed = result.scalar_one_or_none() is not None
            user = await get_or_create_user(
                session,
                email=email,
                username=f"seed_c{circle_index + 1}_u{member_index}",
                display_name=f"{display_name} {circle_index + 1}",
                profile_emoji=emoji,
            )
            if not existed:
                created_count += 1
            circle_users.append(user)
        users_by_circle[circle_index] = circle_users

    print(f"  ✅ Mock user ready: {mock_user.email}")
    print(
        f"  ✅ Dummy users ready: {len(CIRCLE_NAMES) * MEMBERS_PER_CIRCLE} total ({created_count} new)"
    )
    return mock_user, users_by_circle


async def get_or_create_circle(
    session: AsyncSession,
    *,
    name: str,
    description: str,
    owner_id,
) -> Circle:
    """Get a circle by name or create it."""
    result = await session.execute(select(Circle).where(Circle.name == name))
    circle = result.scalar_one_or_none()

    if circle is not None:
        return circle

    circle = Circle(
        name=name,
        description=description,
        invite_code=generate_invite_code(),
        owner_id=owner_id,
        max_members=50,
        member_count=0,
        is_active=True,
    )
    session.add(circle)
    await session.commit()
    await session.refresh(circle)
    return circle


async def get_or_create_membership(
    session: AsyncSession,
    *,
    circle: Circle,
    user: User,
    role: MemberRole,
    nickname: str,
) -> bool:
    """Create a circle membership if missing. Returns True when created."""
    result = await session.execute(
        select(CircleMember).where(
            CircleMember.circle_id == circle.id,
            CircleMember.user_id == user.id,
        )
    )
    membership = result.scalar_one_or_none()

    if membership is not None:
        return False

    session.add(
        CircleMember(
            circle_id=circle.id,
            user_id=user.id,
            role=role,
            nickname=nickname,
            joined_at=datetime.now(UTC) - timedelta(days=7),
        )
    )
    return True


async def seed_circles_and_members(
    session: AsyncSession,
    mock_user: User,
    users_by_circle: dict[int, list[User]],
) -> list[Circle]:
    """Create 5 circles with the mock user plus 10 dummy members each."""
    circles: list[Circle] = []

    for circle_index, (name, description) in enumerate(CIRCLE_NAMES):
        circle = await get_or_create_circle(
            session,
            name=name,
            description=description,
            owner_id=mock_user.id,
        )
        circles.append(circle)

        created_memberships = 0
        created = await get_or_create_membership(
            session,
            circle=circle,
            user=mock_user,
            role=MemberRole.OWNER,
            nickname="나",
        )
        created_memberships += int(created)

        for user in users_by_circle[circle_index]:
            created = await get_or_create_membership(
                session,
                circle=circle,
                user=user,
                role=MemberRole.MEMBER,
                nickname=user.display_name or "친구",
            )
            created_memberships += int(created)

        if created_memberships:
            await session.commit()

        result = await session.execute(
            select(CircleMember.user_id).where(CircleMember.circle_id == circle.id)
        )
        member_count = len(result.scalars().all())
        circle.member_count = member_count
        await session.commit()
        await session.refresh(circle)

        print(f"  ✅ {circle.name}: {member_count} members ({created_memberships} new)")

    return circles


async def get_templates(session: AsyncSession) -> list[PollTemplate]:
    """Get active poll templates."""
    result = await session.execute(
        select(PollTemplate)
        .where(PollTemplate.is_active == True)  # noqa: E712
        .order_by(PollTemplate.category, PollTemplate.question_text)
    )
    return list(result.scalars().all())


async def seed_polls(
    session: AsyncSession,
    *,
    circles: list[Circle],
    creator: User,
    templates: list[PollTemplate],
) -> list[Poll]:
    """Create 5 active polls per circle."""
    if len(templates) < QUESTIONS_PER_CIRCLE:
        raise RuntimeError(
            f"Need at least {QUESTIONS_PER_CIRCLE} active poll templates. "
            "Run scripts/seed_templates.py first."
        )

    now = datetime.now(UTC)
    all_polls: list[Poll] = []
    created_count = 0
    extended_count = 0

    for circle_index, circle in enumerate(circles):
        start = (circle_index * QUESTIONS_PER_CIRCLE) % len(templates)
        selected_templates = [
            templates[(start + offset) % len(templates)] for offset in range(QUESTIONS_PER_CIRCLE)
        ]

        for poll_index, template in enumerate(selected_templates, start=1):
            result = await session.execute(
                select(Poll).where(
                    Poll.circle_id == circle.id,
                    Poll.question_text == template.question_text,
                    Poll.status == PollStatus.ACTIVE,
                )
            )
            poll = result.scalar_one_or_none()

            if poll is None:
                poll = Poll(
                    circle_id=circle.id,
                    template_id=template.id,
                    creator_id=creator.id,
                    question_text=template.question_text,
                    status=PollStatus.ACTIVE,
                    ends_at=now + timedelta(hours=24 + poll_index),
                    vote_count=0,
                )
                session.add(poll)
                created_count += 1
                await session.commit()
                await session.refresh(poll)
            elif poll.ends_at <= now:
                # Reruns after the seeded deadline passed would otherwise leave
                # every poll expired (status stays ACTIVE), hiding them in the app.
                poll.ends_at = now + timedelta(hours=24 + poll_index)
                extended_count += 1
                await session.commit()
                await session.refresh(poll)

            all_polls.append(poll)

        print(f"  ✅ {circle.name}: {QUESTIONS_PER_CIRCLE} active polls ready")

    print(
        f"  📊 Active polls ready: {len(all_polls)} total "
        f"({created_count} new, {extended_count} deadlines extended)"
    )
    return all_polls


async def seed_votes(
    session: AsyncSession,
    *,
    mock_user: User,
    circles: list[Circle],
    users_by_circle: dict[int, list[User]],
    polls: list[Poll],
) -> None:
    """Seed votes on every poll so progress bars, results, and the inbox have data.

    - Voters are always members of the poll's own circle
    - Participation varies per poll (10 → 8 → 6 → 4 → 2 voters) to test different states
    - Roughly a third of votes go to the mock user, filling the received-hearts inbox
    - The mock user votes on the 1st and 3rd poll of each circle, leaving the
      others open so the voting flow itself can still be tested
    """
    circle_index_by_id = {circle.id: index for index, circle in enumerate(circles)}
    poll_offset_by_circle: dict = {}
    created_votes = 0
    created_notifications = 0
    now = datetime.now(UTC)

    async def add_vote(poll: Poll, voter: User, target: User, minutes_ago: int) -> bool:
        nonlocal created_votes
        voter_hash = generate_voter_hash(voter.id, poll.id, salt=str(poll.id))
        result = await session.execute(
            select(Vote).where(
                Vote.poll_id == poll.id,
                Vote.voter_hash == voter_hash,
            )
        )
        if result.scalar_one_or_none() is not None:
            return False

        session.add(
            Vote(
                poll_id=poll.id,
                voter_id=voter.id,
                voter_hash=voter_hash,
                voted_for_id=target.id,
                created_at=now - timedelta(minutes=minutes_ago),
            )
        )
        poll.vote_count += 1
        created_votes += 1
        return True

    for poll in polls:
        circle_index = circle_index_by_id[poll.circle_id]
        offset = poll_offset_by_circle.get(poll.circle_id, 0)
        poll_offset_by_circle[poll.circle_id] = offset + 1
        members = users_by_circle[circle_index]

        voter_count = max(2, MEMBERS_PER_CIRCLE - offset * 2)
        for voter_index, voter in enumerate(members[:voter_count]):
            if (voter_index + offset) % 3 == 0:
                target = mock_user
            else:
                target = members[(voter_index + offset * 3) % len(members)]
                if target.id == voter.id:
                    target = members[(voter_index + offset * 3 + 1) % len(members)]
            await add_vote(poll, voter, target, minutes_ago=20 + offset * 9 + voter_index * 3)

        if offset in (0, 2):
            await add_vote(poll, mock_user, members[offset], minutes_ago=10 + offset * 5)

        # The first poll of each circle always sends hearts to the mock user,
        # so give it an inbox notification as well.
        if offset == 0:
            result = await session.execute(
                select(Notification).where(
                    Notification.user_id == mock_user.id,
                    Notification.type == NotificationType.VOTE_RECEIVED,
                    Notification.data["poll_id"].astext == str(poll.id),
                )
            )
            if result.scalar_one_or_none() is None:
                session.add(
                    Notification(
                        user_id=mock_user.id,
                        type=NotificationType.VOTE_RECEIVED,
                        title="🎊 누군가 당신을 선택했어요!",
                        body=f'"{poll.question_text[:28]}" 투표에서 선택받았어요',
                        data={
                            "type": "vote_received",
                            "poll_id": str(poll.id),
                            "circle_id": str(poll.circle_id),
                            "action_url": f"circly://results/{poll.id}",
                        },
                        is_read=False,
                    )
                )
                created_notifications += 1

    await session.commit()
    print(f"  ✅ Votes ready: {created_votes} new votes")
    print(f"  ✅ Inbox notifications ready: {created_notifications} new")


async def main() -> None:
    """Main entry point for the seed script."""
    settings = get_settings()

    print("🌱 Starting local UX test seed script...")
    print(f"📌 Database: {settings.database_url.split('@')[-1]}")
    print()

    engine = create_async_engine(settings.database_url, echo=False)
    session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_maker() as session:
        print("👥 Seeding users...")
        mock_user, users_by_circle = await seed_users(session)

        print("\n🔵 Seeding circles and members...")
        circles = await seed_circles_and_members(session, mock_user, users_by_circle)

        print("\n📋 Verifying poll templates...")
        templates = await get_templates(session)
        if not templates:
            print("  ❌ No poll templates found.")
            print("  💡 Run first: uv run python scripts/seed_templates.py")
            await engine.dispose()
            return
        print(f"  📊 Found {len(templates)} templates")

        print("\n🗳️ Seeding active polls...")
        polls = await seed_polls(
            session,
            circles=circles,
            creator=mock_user,
            templates=templates,
        )

        print("\n💌 Seeding votes / received hearts / inbox...")
        await seed_votes(
            session,
            mock_user=mock_user,
            circles=circles,
            users_by_circle=users_by_circle,
            polls=polls,
        )

    await engine.dispose()
    print("\n✅ Local UX test seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
