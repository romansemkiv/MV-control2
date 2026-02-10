"""initial schema

Revision ID: b4268dbf37f0
Revises:
Create Date: 2026-02-09 22:44:13.830315

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b4268dbf37f0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('login', sa.String(100), unique=True, nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='user'),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('last_login', sa.DateTime, nullable=True),
    )

    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('token_hash', sa.String(255), unique=True, nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
    )

    op.create_table(
        'sources',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('quartz_input', sa.Integer, unique=True, nullable=False),
        sa.Column('label', sa.String(100), server_default=''),
    )

    op.create_table(
        'multiviewers',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('nexx_index', sa.Integer, unique=True, nullable=False),
        sa.Column('label', sa.String(100), server_default=''),
        sa.Column('enabled', sa.Boolean, server_default='true'),
    )

    op.create_table(
        'user_access_sources',
        sa.Column('user_id', sa.Integer, primary_key=True),
        sa.Column('source_id', sa.Integer, primary_key=True),
    )

    op.create_table(
        'user_access_mvs',
        sa.Column('user_id', sa.Integer, primary_key=True),
        sa.Column('mv_id', sa.Integer, primary_key=True),
    )

    op.create_table(
        'presets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('payload_json', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'state_mv',
        sa.Column('mv_id', sa.Integer, primary_key=True),
        sa.Column('layout', sa.Integer, nullable=True),
        sa.Column('font', sa.Integer, nullable=True),
        sa.Column('outer_border', sa.Integer, nullable=True),
        sa.Column('inner_border', sa.Integer, nullable=True),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'state_windows',
        sa.Column('mv_id', sa.Integer, primary_key=True),
        sa.Column('window_index', sa.Integer, primary_key=True),
        sa.Column('pcm_bars', sa.Integer, nullable=True),
        sa.Column('umd_json', sa.Text, nullable=True),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'state_routing',
        sa.Column('output', sa.Integer, primary_key=True),
        sa.Column('input', sa.Integer, nullable=True),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'integrations',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('protocol', sa.String(20), nullable=False),
        sa.Column('host', sa.String(255), nullable=False),
        sa.Column('port', sa.Integer, nullable=True),
        sa.Column('api_key', sa.String(255), nullable=True),
        sa.Column('jwt_credentials', sa.Text, nullable=True),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('integrations')
    op.drop_table('state_routing')
    op.drop_table('state_windows')
    op.drop_table('state_mv')
    op.drop_table('presets')
    op.drop_table('user_access_mvs')
    op.drop_table('user_access_sources')
    op.drop_table('multiviewers')
    op.drop_table('sources')
    op.drop_table('sessions')
    op.drop_table('users')
