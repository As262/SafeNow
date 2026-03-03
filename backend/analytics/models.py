from django.db import models


# Analytics app uses aggregations from SOSRequest model.
# No separate models needed - views query sos.SOSRequest directly.
