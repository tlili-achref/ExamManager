"""Initial grade table

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
        "grades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exam_id", sa.Integer(), nullable=False),
        sa.Column("subject_name", sa.String(150), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("student_matricule", sa.String(40), nullable=False),
        sa.Column("student_name", sa.String(150), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("grades")
