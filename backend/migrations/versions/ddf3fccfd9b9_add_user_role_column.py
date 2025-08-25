"""Add user role column

Revision ID: ddf3fccfd9b9
Revises: c7f8e3a9b2d1
Create Date: 2025-08-25 14:43:39.215365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddf3fccfd9b9'
down_revision: Union[str, Sequence[str], None] = 'c7f8e3a9b2d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add role column with default value
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='USER'))
    
    # Update existing users to have USER role
    op.execute("UPDATE users SET role = 'USER' WHERE role IS NULL OR role = ''")
    
    # Remove server default after setting values for existing records
    op.alter_column('users', 'role', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove role column
    op.drop_column('users', 'role')
