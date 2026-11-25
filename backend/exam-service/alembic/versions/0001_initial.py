"""Initial exam table

Revision ID: 0001
Revises:
Create Date: 2026-11-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "exams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subject_id", sa.Integer(), nullable=True),
        sa.Column("subject_name", sa.String(150), nullable=False),
        sa.Column("department", sa.String(120), nullable=False),
        sa.Column("exam_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="90"),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=True),
        sa.Column("room_name", sa.String(100), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("group_name", sa.String(80), nullable=False),
        sa.Column("supervisor_ids", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("exams")
