"""create vote sessions table

Revision ID: b7c9d2e1f4a6
Revises: 6fe99469a1eb
Create Date: 2026-07-11 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7c9d2e1f4a6"
down_revision: str | Sequence[str] | None = "6fe99469a1eb"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "vote_sessions",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("circle_id", sa.UUID(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="ACTIVE", nullable=False),
        sa.Column("poll_ids", sa.JSON(), nullable=False),
        sa.Column("current_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("skipped_poll_ids", sa.JSON(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["circle_id"], ["circles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vote_sessions_circle_id"), "vote_sessions", ["circle_id"], unique=False)
    op.create_index(op.f("ix_vote_sessions_user_id"), "vote_sessions", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_vote_sessions_user_id"), table_name="vote_sessions")
    op.drop_index(op.f("ix_vote_sessions_circle_id"), table_name="vote_sessions")
    op.drop_table("vote_sessions")
