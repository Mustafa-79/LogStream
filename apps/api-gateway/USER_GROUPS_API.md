# User Groups API Documentation

## Overview
The User Groups API provides a single, flexible endpoint for fetching user groups with pagination, search, and filtering capabilities.

## Endpoint

### Get User Groups
**GET** `/api/user-groups`

**Query Parameters:**
- `page` (number, optional, default: 1): Page number
- `search` (string, optional): Search term for group name only (case-insensitive)
- `status` (string, optional, default: 'all'): Filter by status ('active', 'inactive', 'all')
- `applicationIds` (string, optional): Comma-separated application IDs to filter groups

**Note:** Results are limited to 4 groups per page and always sorted alphabetically by group name.

**Response:**
```json
{
  "status": 200,
  "message": "User groups fetched successfully",
  "data": {
    "groups": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalGroups": 45,
      "groupsPerPage": 4,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Usage Examples

### Basic Operations
```bash
# Get first page with 4 groups (sorted alphabetically by name)
curl -X GET "http://localhost:3000/api/user-groups?page=1"

# Search for groups with names containing "admin"
curl -X GET "http://localhost:3000/api/user-groups?search=admin"

# Get only active groups
curl -X GET "http://localhost:3000/api/user-groups?status=active"
```

### Application Filtering
```bash
# Get groups with specific application IDs
curl -X GET "http://localhost:3000/api/user-groups?applicationIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012"

# Get groups with a specific application and only active status
curl -X GET "http://localhost:3000/api/user-groups?applicationIds=507f1f77bcf86cd799439011&status=active"
```

### Complex Queries
```bash
# Search active groups with specific application
curl -X GET "http://localhost:3000/api/user-groups?status=active&applicationIds=507f1f77bcf86cd799439011&page=1"

# Search by group name and filter by application IDs
curl -X GET "http://localhost:3000/api/user-groups?search=developer&applicationIds=507f1f77bcf86cd799439011"

# Combined search and filter with pagination
curl -X GET "http://localhost:3000/api/user-groups?search=admin&status=active&applicationIds=507f1f77bcf86cd799439011&page=2"
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized
- `403`: Forbidden (admin access required)
- `500`: Internal Server Error

## Rate Limiting

- Fixed to 4 groups per page
- All endpoints require admin authentication
- Standard API rate limits apply

## Notes

- Search operations are case-insensitive and only work on group names
- Pagination starts from page 1
- Deleted groups are excluded from all results
- Member and application lookups are populated automatically
- **All results are always sorted alphabetically by group name**
- **Members within groups are sorted alphabetically by username**
- **Applications within groups are sorted alphabetically by application name**
- Only group name search and application filtering are supported
