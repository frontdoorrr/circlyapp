"""Application constants.

Centralized location for all magic numbers and configuration constants.
"""

from datetime import timedelta

# Circle constants
INVITE_CODE_LENGTH = 6
MIN_CIRCLE_MEMBERS = 10
MAX_CIRCLE_MEMBERS = 50
DEFAULT_MAX_CIRCLE_MEMBERS = 50

# Poll constants
MAX_ACTIVE_POLLS_PER_CIRCLE = 3
POLL_DURATION_MAP = {
    "1H": timedelta(hours=1),
    "3H": timedelta(hours=3),
    "6H": timedelta(hours=6),
    "24H": timedelta(hours=24),
}

# Report constants
AUTO_REPORT_BLOCK_THRESHOLD = 5

# Result card constants
RESULT_CARD_WIDTH = 1080
RESULT_CARD_HEIGHT = 1920

# Pagination defaults
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Authentication constants
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 100
MIN_USERNAME_LENGTH = 2
MAX_USERNAME_LENGTH = 50

# Rate limiting
DEFAULT_RATE_LIMIT_PER_MINUTE = 100
