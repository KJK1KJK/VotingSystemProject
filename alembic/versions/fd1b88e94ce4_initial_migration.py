"""Initial migration

Revision ID: fd1b88e94ce4
Revises: 
Create Date: 2025-06-02 22:20:04.603163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd1b88e94ce4'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_groups_id'), table_name='user_groups')
    op.drop_table('user_groups')
    op.drop_index(op.f('ix_group_memberships_id'), table_name='group_memberships')
    op.drop_table('group_memberships')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('group_memberships',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('group_id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('time_joined', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], ['user_groups.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_group_memberships_id'), 'group_memberships', ['id'], unique=False)
    op.create_table('user_groups',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('name', sa.VARCHAR(), nullable=False),
    sa.Column('description', sa.VARCHAR(), nullable=True),
    sa.Column('creator_id', sa.INTEGER(), nullable=False),
    sa.Column('time_created', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_user_groups_id'), 'user_groups', ['id'], unique=False)
    # ### end Alembic commands ###
