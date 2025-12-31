"""Supabase Auth migration - add supabase_user_id, remove hashed_password

Revision ID: a1b2c3d4e5f6
Revises: 2dae34b28d24
Create Date: 2025-12-31

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "2dae34b28d24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema for Supabase Auth.

    - Add supabase_user_id column (UUID string from Supabase)
    - Remove hashed_password column (Supabase manages passwords)
    """
    # Add supabase_user_id column
    op.add_column(
        "users",
        sa.Column("supabase_user_id", sa.String(length=255), nullable=True),
    )
    op.create_index(
        op.f("ix_users_supabase_user_id"),
        "users",
        ["supabase_user_id"],
        unique=True,
    )

    # Remove hashed_password column
    op.drop_column("users", "hashed_password")


def downgrade() -> None:
    """Downgrade schema - restore hashed_password, remove supabase_user_id."""
    # Restore hashed_password column
    op.add_column(
        "users",
        sa.Column(
            "hashed_password",
            sa.String(length=255),
            nullable=True,  # Allow null for downgrade compatibility
        ),
    )

    # Remove supabase_user_id
    op.drop_index(op.f("ix_users_supabase_user_id"), table_name="users")
    op.drop_column("users", "supabase_user_id")
