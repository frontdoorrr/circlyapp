"""fix_poll_schema_to_match_models

Revision ID: 48f2903cb7ea
Revises: add_extended_auth_system
Create Date: 2025-08-24 06:38:52.838887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48f2903cb7ea'
down_revision: Union[str, Sequence[str], None] = 'add_extended_auth_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to match current models."""
    
    # 1. 외래키 제약조건 제거 (타입 변경을 위해)
    op.drop_constraint('poll_options_poll_id_fkey', 'poll_options', type_='foreignkey')
    op.drop_constraint('votes_poll_id_fkey', 'votes', type_='foreignkey')
    op.drop_constraint('votes_option_id_fkey', 'votes', type_='foreignkey')
    op.drop_constraint('poll_options_user_id_fkey', 'poll_options', type_='foreignkey')
    
    # 2. polls 테이블 수정
    # title -> question_text로 컬럼명 변경
    op.alter_column('polls', 'title', new_column_name='question_text')
    
    # question_template -> template_id로 컬럼명 변경
    op.alter_column('polls', 'question_template', new_column_name='template_id')
    
    # expires_at -> deadline으로 컬럼명 변경
    op.alter_column('polls', 'expires_at', new_column_name='deadline')
    
    # id 컬럼을 String 타입으로 변경 (UUID 지원)
    op.alter_column('polls', 'id', type_=sa.String(), existing_type=sa.Integer())
    
    # 3. poll_options 테이블 수정
    # text -> member_nickname으로 컬럼명 변경
    op.alter_column('poll_options', 'text', new_column_name='member_nickname')
    
    # user_id -> member_id로 컬럼명 변경
    op.alter_column('poll_options', 'user_id', new_column_name='member_id')
    
    # order_index -> display_order로 컬럼명 변경
    op.alter_column('poll_options', 'order_index', new_column_name='display_order')
    
    # id 컬럼을 String 타입으로 변경 (UUID 지원)
    op.alter_column('poll_options', 'id', type_=sa.String(), existing_type=sa.Integer())
    
    # poll_id를 String 타입으로 변경
    op.alter_column('poll_options', 'poll_id', type_=sa.String(), existing_type=sa.Integer())
    
    # 4. votes 테이블 수정
    # id 컬럼을 String 타입으로 변경 (UUID 지원)
    op.alter_column('votes', 'id', type_=sa.String(), existing_type=sa.Integer())
    
    # poll_id와 option_id를 String 타입으로 변경
    op.alter_column('votes', 'poll_id', type_=sa.String(), existing_type=sa.Integer())
    op.alter_column('votes', 'option_id', type_=sa.String(), existing_type=sa.Integer())
    
    # 5. 외래키 제약조건 다시 생성
    op.create_foreign_key('poll_options_poll_id_fkey', 'poll_options', 'polls', ['poll_id'], ['id'])
    op.create_foreign_key('votes_poll_id_fkey', 'votes', 'polls', ['poll_id'], ['id'])
    op.create_foreign_key('votes_option_id_fkey', 'votes', 'poll_options', ['option_id'], ['id'])
    
    # 6. question_templates 테이블 생성 (모델에서 참조하는 테이블)
    # 테이블이 이미 존재하는지 확인 후 생성
    inspector = op.get_bind().dialect.inspector(op.get_bind())
    if 'question_templates' not in inspector.get_table_names():
        op.create_table('question_templates',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('category', sa.String(50), nullable=False),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
            sa.Column('usage_count', sa.Integer(), default=0, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
    
    # 7. circle_members 테이블이 없다면 생성
    # (모델에서 참조하는 테이블)
    if 'circle_members' not in inspector.get_table_names():
        op.create_table('circle_members',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('circle_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(20), nullable=True),
            sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['circle_id'], ['circles.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    """Rollback schema changes."""
    
    # 1. 외래키 제약조건 제거
    op.drop_constraint('votes_option_id_fkey', 'votes', type_='foreignkey')
    op.drop_constraint('votes_poll_id_fkey', 'votes', type_='foreignkey')
    op.drop_constraint('poll_options_poll_id_fkey', 'poll_options', type_='foreignkey')
    
    # 2. question_templates 테이블 삭제
    op.drop_table('question_templates')
    
    # 3. circle_members 테이블 삭제
    op.drop_table('circle_members')
    
    # 4. votes 테이블 롤백
    op.alter_column('votes', 'option_id', type_=sa.Integer(), existing_type=sa.String())
    op.alter_column('votes', 'poll_id', type_=sa.Integer(), existing_type=sa.String())
    op.alter_column('votes', 'id', type_=sa.Integer(), existing_type=sa.String())
    
    # 5. poll_options 테이블 롤백
    op.alter_column('poll_options', 'poll_id', type_=sa.Integer(), existing_type=sa.String())
    op.alter_column('poll_options', 'id', type_=sa.Integer(), existing_type=sa.String())
    op.alter_column('poll_options', 'display_order', new_column_name='order_index')
    op.alter_column('poll_options', 'member_id', new_column_name='user_id')
    op.alter_column('poll_options', 'member_nickname', new_column_name='text')
    
    # 6. polls 테이블 롤백
    op.alter_column('polls', 'id', type_=sa.Integer(), existing_type=sa.String())
    op.alter_column('polls', 'deadline', new_column_name='expires_at')
    op.alter_column('polls', 'template_id', new_column_name='question_template')
    op.alter_column('polls', 'question_text', new_column_name='title')
    
    # 7. 외래키 제약조건 다시 생성
    op.create_foreign_key('poll_options_poll_id_fkey', 'poll_options', 'polls', ['poll_id'], ['id'])
    op.create_foreign_key('votes_poll_id_fkey', 'votes', 'polls', ['poll_id'], ['id'])
    op.create_foreign_key('votes_option_id_fkey', 'votes', 'poll_options', ['option_id'], ['id'])
    op.create_foreign_key('poll_options_user_id_fkey', 'poll_options', 'users', ['user_id'], ['id'])
