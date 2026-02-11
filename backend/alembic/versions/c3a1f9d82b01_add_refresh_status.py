"""add refresh_status table

Revision ID: c3a1f9d82b01
Revises: 81e6078f2e2a
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3a1f9d82b01'
down_revision: Union[str, None] = '81e6078f2e2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'refresh_status',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('is_running', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('started_by', sa.String(100), nullable=True),
        sa.Column('result_json', sa.Text(), nullable=True),
    )
    op.execute("INSERT INTO refresh_status (id, is_running) VALUES (1, false)")


def downgrade() -> None:
    op.drop_table('refresh_status')
