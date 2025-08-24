import httpx
import asyncio
from datetime import datetime, time as datetime_time
from zoneinfo import ZoneInfo
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import PushToken, NotificationSetting, NotificationLog
from app.models.poll import Poll, Vote
from app.models.circle import CircleMember
from app.config import settings

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"
    
    async def send_poll_start_notification(self, poll_id: str) -> bool:
        """투표 시작 알림 발송"""
        try:
            # Poll 정보 조회
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # Circle 멤버들 조회 (생성자 제외)
            members_query = select(CircleMember).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.user_id != poll.creator_id,
                    CircleMember.is_active == True
                )
            )
            members_result = await self.db.execute(members_query)
            members = members_result.scalars().all()
            
            if not members:
                return True
            
            # 푸시 토큰 조회 및 알림 설정 확인
            user_ids = [member.user_id for member in members]
            valid_tokens = await self._get_valid_push_tokens(
                user_ids, 
                notification_type="poll_start"
            )
            
            if not valid_tokens:
                return True
            
            # 알림 내용 생성
            question_preview = poll.question_text[:30]
            if len(poll.question_text) > 30:
                question_preview += "..."
            
            title = "🗳️ 새로운 투표가 시작됐어요!"
            body = f'"{question_preview}"\n지금 바로 참여해보세요! 👆'
            
            data = {
                "type": "poll_start",
                "poll_id": str(poll.id),
                "circle_id": str(poll.circle_id),
                "action_url": f"circly://poll-participation/{poll.id}"
            }
            
            # 배치 발송
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            # 로그 저장
            await self._save_notification_logs(
                user_ids, poll_id, "poll_start", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll start notification: {e}")
            return False
    
    async def send_poll_deadline_notification(
        self, 
        poll_id: str, 
        reminder_type: str = "1h"
    ) -> bool:
        """투표 마감 임박 알림 발송"""
        try:
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # 미참여자만 조회
            non_voters_query = select(CircleMember.user_id).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.is_active == True,
                    ~CircleMember.user_id.in_(
                        select(Vote.user_id).where(Vote.poll_id == poll_id)
                    )
                )
            )
            non_voters_result = await self.db.execute(non_voters_query)
            non_voter_ids = [row[0] for row in non_voters_result.fetchall()]
            
            if not non_voter_ids:
                return True
            
            valid_tokens = await self._get_valid_push_tokens(
                non_voter_ids,
                notification_type="poll_deadline"
            )
            
            if not valid_tokens:
                return True
            
            # 알림 내용 (reminder_type에 따라 다름)
            question_preview = poll.question_text[:20 if reminder_type == "10m" else 30]
            if len(poll.question_text) > (20 if reminder_type == "10m" else 30):
                question_preview += "..."
            
            if reminder_type == "1h":
                title = "⏰ 투표 마감 1시간 전!"
                body = f'"{question_preview}"\n친구들이 기다리고 있어요 🔥'
            else:  # 10m
                title = "🚨 마지막 기회!"
                body = f'"{question_preview}" 투표 마감 10분 전\n놓치면 후회할걸요? 😱'
            
            data = {
                "type": "poll_deadline",
                "poll_id": str(poll.id),
                "reminder_type": reminder_type,
                "action_url": f"circly://poll-participation/{poll.id}"
            }
            
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            await self._save_notification_logs(
                non_voter_ids, poll_id, "poll_deadline", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll deadline notification: {e}")
            return False
    
    async def send_poll_result_notification(self, poll_id: str) -> bool:
        """투표 결과 발표 알림 발송"""
        try:
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # Circle 전체 멤버 조회
            members_query = select(CircleMember.user_id).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.is_active == True
                )
            )
            members_result = await self.db.execute(members_query)
            member_ids = [row[0] for row in members_result.fetchall()]
            
            if not member_ids:
                return True
            
            valid_tokens = await self._get_valid_push_tokens(
                member_ids,
                notification_type="poll_result"
            )
            
            if not valid_tokens:
                return True
            
            question_preview = poll.question_text[:30]
            if len(poll.question_text) > 30:
                question_preview += "..."
            
            title = "🎉 투표 결과가 나왔어요!"
            body = f'"{question_preview}"\n궁금하지 않아? 결과 확인하러 가기 ✨'
            
            data = {
                "type": "poll_result",
                "poll_id": str(poll.id),
                "action_url": f"circly://poll-results/{poll.id}"
            }
            
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            await self._save_notification_logs(
                member_ids, poll_id, "poll_result", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll result notification: {e}")
            return False
    
    async def _get_valid_push_tokens(
        self, 
        user_ids: List[int], 
        notification_type: str
    ) -> List[Dict[str, Any]]:
        """유효한 푸시 토큰 및 설정 확인"""
        current_time = datetime.now(ZoneInfo("Asia/Seoul")).time()
        
        # 복잡한 쿼리로 한번에 필터링
        query = select(
            PushToken.expo_token,
            PushToken.user_id,
            NotificationSetting.quiet_hours_start,
            NotificationSetting.quiet_hours_end,
            NotificationSetting.all_notifications,
            NotificationSetting.poll_start_notifications,
            NotificationSetting.poll_deadline_notifications,
            NotificationSetting.poll_result_notifications
        ).select_from(
            PushToken.__table__.join(
                NotificationSetting.__table__,
                PushToken.user_id == NotificationSetting.user_id,
                isouter=True
            )
        ).where(
            and_(
                PushToken.user_id.in_(user_ids),
                PushToken.is_active == True
            )
        )
        
        result = await self.db.execute(query)
        tokens_data = result.fetchall()
        
        valid_tokens = []
        for row in tokens_data:
            # 기본 설정값 처리
            all_notifications = row.all_notifications if row.all_notifications is not None else True
            
            # 알림 설정 확인
            if not all_notifications:
                continue
                
            type_enabled = True
            if notification_type == "poll_start":
                type_enabled = row.poll_start_notifications if row.poll_start_notifications is not None else True
            elif notification_type == "poll_deadline":
                type_enabled = row.poll_deadline_notifications if row.poll_deadline_notifications is not None else True
            elif notification_type == "poll_result":
                type_enabled = row.poll_result_notifications if row.poll_result_notifications is not None else True
            
            if not type_enabled:
                continue
            
            # 조용한 시간 확인
            quiet_start = row.quiet_hours_start or datetime_time(22, 0)
            quiet_end = row.quiet_hours_end or datetime_time(8, 0)
            
            is_quiet_time = False
            if quiet_start < quiet_end:
                is_quiet_time = quiet_start <= current_time <= quiet_end
            else:  # 자정을 넘어가는 경우
                is_quiet_time = current_time >= quiet_start or current_time <= quiet_end
            
            if is_quiet_time:
                continue
                
            valid_tokens.append({
                "token": row.expo_token,
                "user_id": str(row.user_id)
            })
        
        return valid_tokens
    
    async def _send_push_notifications_batch(
        self,
        tokens_data: List[Dict[str, Any]],
        title: str,
        body: str,
        data: Dict[str, Any],
        batch_size: int = 100
    ) -> List[str]:
        """배치로 푸시 알림 발송"""
        receipt_ids = []
        
        # 토큰만 추출
        tokens = [item["token"] for item in tokens_data]
        
        # 배치 단위로 분할
        for i in range(0, len(tokens), batch_size):
            batch_tokens = tokens[i:i + batch_size]
            
            messages = []
            for token in batch_tokens:
                messages.append({
                    "to": token,
                    "title": title,
                    "body": body,
                    "data": data,
                    "sound": "default",
                    "priority": "high"
                })
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.expo_push_url,
                        json=messages,
                        headers={
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        if "data" in response_data:
                            for item in response_data["data"]:
                                if "id" in item:
                                    receipt_ids.append(item["id"])
                    
                    # Rate limiting 준수
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                print(f"Error sending batch notifications: {e}")
                continue
        
        return receipt_ids
    
    async def _save_notification_logs(
        self,
        user_ids: List[int],
        poll_id: str,
        notification_type: str,
        title: str,
        body: str,
        receipt_ids: List[str]
    ):
        """알림 발송 로그 저장"""
        try:
            logs = []
            for user_id in user_ids:
                log = NotificationLog(
                    user_id=user_id,
                    poll_id=poll_id,
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    sent_at=datetime.now(ZoneInfo("UTC")),
                    status="sent"
                )
                logs.append(log)
            
            self.db.add_all(logs)
            await self.db.commit()
            
        except Exception as e:
            print(f"Error saving notification logs: {e}")
            await self.db.rollback()