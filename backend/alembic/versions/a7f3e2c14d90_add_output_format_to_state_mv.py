"""add output_format to state_mv

Revision ID: a7f3e2c14d90
Revises: c3a1f9d82b01
Create Date: 2026-02-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f3e2c14d90'
down_revision: Union[str, None] = 'c3a1f9d82b01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('state_mv', sa.Column('output_format', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('state_mv', 'output_format')
