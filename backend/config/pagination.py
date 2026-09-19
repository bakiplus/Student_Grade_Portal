from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class with generous default page size
    and dynamic page_size query parameter support.
    """
    page_size = 200
    page_size_query_param = 'page_size'
    max_page_size = 2000
