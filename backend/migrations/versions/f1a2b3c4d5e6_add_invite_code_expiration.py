"""add invite code expiration

Revision ID: f1a2b3c4d5e6
Revises: d0e1f2a3b4c5
Create Date: 2026-07-19

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = "d0e1f2a3b4c5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add a 24-hour expiration to existing and future invite codes."""
    op.execute(
        "UPDATE circles SET invite_link_id = gen_random_uuid() "
        "WHERE invite_link_id IS NULL"
    )
    op.alter_column("circles", "invite_link_id", nullable=False)
    op.add_column(
        "circles",
        sa.Column(
            "invite_code_expires_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(now() + interval '24 hours')"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Remove invite code expiration."""
    op.drop_column("circles", "invite_code_expires_at")
    op.alter_column("circles", "invite_link_id", nullable=True)
