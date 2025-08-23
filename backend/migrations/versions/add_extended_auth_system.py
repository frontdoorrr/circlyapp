"""Add extended authentication system

Revision ID: add_extended_auth_system
Revises: 973842ece436
Create Date: 2025-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_extended_auth_system'
down_revision = '973842ece436'
branch_labels = None
depends_on = None


def upgrade():
    # User 테이블 확장
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), default=False))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('account_type', sa.String(20), default='device'))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('login_attempts', sa.Integer(), default=0))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))
    
    # 소셜 계정 연동 테이블
    op.create_table(
        'user_social_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(20), nullable=False),
        sa.Column('provider_id', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('profile_image_url', sa.Text(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'provider_id')
    )
    
    # 2단계 인증 테이블
    op.create_table(
        'user_two_factor_auth',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('method', sa.String(20), nullable=False),
        sa.Column('secret', sa.String(255), nullable=True),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('backup_codes', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('enabled', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'method')
    )
    
    # 디바이스 관리 테이블
    op.create_table(
        'user_devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(255), nullable=False),
        sa.Column('device_name', sa.String(100), nullable=True),
        sa.Column('device_type', sa.String(20), nullable=True),
        sa.Column('fcm_token', sa.String(255), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'device_id')
    )
    
    # 로그인 기록 테이블
    op.create_table(
        'user_login_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('ip_address', postgresql.INET(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('login_method', sa.String(20), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('failure_reason', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 이메일 인증 테이블
    op.create_table(
        'email_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('verified', sa.Boolean(), default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    
    # 비밀번호 재설정 테이블
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('used', sa.Boolean(), default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    
    # 인덱스 생성
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_account_type', 'users', ['account_type'])
    op.create_index('idx_users_email_verified', 'users', ['email_verified'])
    
    op.create_index('idx_social_accounts_user_id', 'user_social_accounts', ['user_id'])
    op.create_index('idx_social_accounts_provider', 'user_social_accounts', ['provider', 'provider_id'])
    
    op.create_index('idx_2fa_user_id', 'user_two_factor_auth', ['user_id'])
    
    op.create_index('idx_devices_user_id', 'user_devices', ['user_id'])
    op.create_index('idx_devices_device_id', 'user_devices', ['device_id'])
    
    op.create_index('idx_login_logs_user_id', 'user_login_logs', ['user_id'])
    op.create_index('idx_login_logs_created_at', 'user_login_logs', ['created_at'])
    op.create_index('idx_login_logs_ip_address', 'user_login_logs', ['ip_address'])
    
    op.create_index('idx_email_verifications_user_id', 'email_verifications', ['user_id'])
    op.create_index('idx_email_verifications_token', 'email_verifications', ['token'])
    
    op.create_index('idx_password_reset_user_id', 'password_reset_tokens', ['user_id'])
    op.create_index('idx_password_reset_token', 'password_reset_tokens', ['token'])


def downgrade():
    # 인덱스 삭제
    op.drop_index('idx_password_reset_token')
    op.drop_index('idx_password_reset_user_id')
    op.drop_index('idx_email_verifications_token')
    op.drop_index('idx_email_verifications_user_id')
    op.drop_index('idx_login_logs_ip_address')
    op.drop_index('idx_login_logs_created_at')
    op.drop_index('idx_login_logs_user_id')
    op.drop_index('idx_devices_device_id')
    op.drop_index('idx_devices_user_id')
    op.drop_index('idx_2fa_user_id')
    op.drop_index('idx_social_accounts_provider')
    op.drop_index('idx_social_accounts_user_id')
    op.drop_index('idx_users_email_verified')
    op.drop_index('idx_users_account_type')
    op.drop_index('idx_users_email')
    
    # 테이블 삭제
    op.drop_table('password_reset_tokens')
    op.drop_table('email_verifications')
    op.drop_table('user_login_logs')
    op.drop_table('user_devices')
    op.drop_table('user_two_factor_auth')
    op.drop_table('user_social_accounts')
    
    # User 테이블 컬럼 제거
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'login_attempts')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'account_type')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email')