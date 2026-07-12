"""create received heart reads table

Revision ID: d4e5f6a7b8c9
Revises: b7c9d2e1f4a6
Create Date: 2026-07-12 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | Sequence[str] | None = "b7c9d2e1f4a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "received_heart_reads",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("poll_id", sa.UUID(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["poll_id"], ["polls.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "poll_id", name="uq_received_heart_read"),
    )
    op.create_index(op.f("ix_received_heart_reads_poll_id"), "received_heart_reads", ["poll_id"], unique=False)
    op.create_index(op.f("ix_received_heart_reads_user_id"), "received_heart_reads", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_received_heart_reads_user_id"), table_name="received_heart_reads")
    op.drop_index(op.f("ix_received_heart_reads_poll_id"), table_name="received_heart_reads")
    op.drop_table("received_heart_reads")
