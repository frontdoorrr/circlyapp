"""add push notification models

Revision ID: c7f8e3a9b2d1
Revises: 48f2903cb7ea
Create Date: 2024-08-24 15:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'c7f8e3a9b2d1'
down_revision = '48f2903cb7ea'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create push_tokens table
    op.create_table('push_tokens',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('expo_token', sa.String(length=255), nullable=False),
    sa.Column('device_id', sa.String(length=255), nullable=True),
    sa.Column('platform', sa.String(length=10), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_push_tokens_expo_token'), 'push_tokens', ['expo_token'], unique=False)
    op.create_index(op.f('ix_push_tokens_expo_token_unique'), 'push_tokens', ['expo_token'], unique=True)

    # Create notification_settings table  
    op.create_table('notification_settings',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('all_notifications', sa.Boolean(), nullable=False),
    sa.Column('poll_start_notifications', sa.Boolean(), nullable=False),
    sa.Column('poll_deadline_notifications', sa.Boolean(), nullable=False),
    sa.Column('poll_result_notifications', sa.Boolean(), nullable=False),
    sa.Column('quiet_hours_start', sa.Time(), nullable=False),
    sa.Column('quiet_hours_end', sa.Time(), nullable=False),
    sa.Column('max_daily_notifications', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )

    # Create notification_logs table
    op.create_table('notification_logs',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('poll_id', sa.String(), nullable=True),
    sa.Column('notification_type', sa.String(length=50), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('expo_receipt_id', sa.String(length=255), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['poll_id'], ['polls.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('notification_logs')
    op.drop_table('notification_settings')
    op.drop_index(op.f('ix_push_tokens_expo_token_unique'), table_name='push_tokens')
    op.drop_index(op.f('ix_push_tokens_expo_token'), table_name='push_tokens')
    op.drop_table('push_tokens')