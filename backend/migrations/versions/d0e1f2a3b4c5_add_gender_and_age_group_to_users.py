"""add gender and age group to users

Revision ID: d0e1f2a3b4c5
Revises: c0d1e2f3a4b5
Create Date: 2026-07-13 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d0e1f2a3b4c5"
down_revision: str | Sequence[str] | None = "c0d1e2f3a4b5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "gender",
            sa.String(length=20),
            nullable=False,
            server_default="UNSPECIFIED",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "age_group",
            sa.String(length=20),
            nullable=False,
            server_default="UNSPECIFIED",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "age_group")
    op.drop_column("users", "gender")
