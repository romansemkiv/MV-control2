"""add max inputs outputs to integrations

Revision ID: 81e6078f2e2a
Revises: b4268dbf37f0
Create Date: 2026-02-10 22:53:32.511731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81e6078f2e2a'
down_revision: Union[str, None] = 'b4268dbf37f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('integrations', sa.Column('max_inputs', sa.Integer(), nullable=True))
    op.add_column('integrations', sa.Column('max_outputs', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('integrations', 'max_outputs')
    op.drop_column('integrations', 'max_inputs')
