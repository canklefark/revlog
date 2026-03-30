# MotorsportReg.com REST API

MotorsportReg.com provides a RESTful API intended for programmers, developers and hackers with at least some technical skills who wish to access the system programmatically for integration with their own systems.

---

## Authentication

Most requests require valid credentials. There are three ways to authenticate:

### OAuth 1.0 (Preferred)

We support three-legged OAuth 1.0a:

1. Register your application by contacting us
2. Obtain a Request Token at `/rest/tokens/request`
3. Direct users to our authorization URL: `https://www.motorsportreg.com/index.cfm/event/oauth`
4. Exchange Request Token for Access Token at `/rest/tokens/access`
5. Make requests on behalf of users with their Access Token and an `X-Organization-Id` (for resources that require one)

### Use an existing administrative username and password

- Good for one-off tasks or in-house scripts, not for sharing with 3rd party apps or developers
- Each request must pass an `X-Organization-Id` header which contains the 35-character unique organization ID to access

### Use custom API credentials provided by MotorsportReg.com _(Deprecated)_

To request credentials for authentication, tell us what you're building.

---

For user agents that support it, a `crossdomain.xml` file is located at `https://api.motorsportreg.com/crossdomain.xml`. Every request also responds with the HTTP header `Access-Control-Allow-Origin` set to `*`, permitting mashups with data from any domain.

---

## Licensing & Attribution

Use of the API is subject to prior approval and may be revoked at any time without warning. Content that is displayed must include one of the provided logo snippets exactly as it appears in the HTML. Other sizes may be provided upon request.

---

## Resources and Locations

A REST interface presents resources at published locations. Access them securely over SSL. The base URL is `https://api.motorsportreg.com`.

### Unauthenticated

#### `GET /rest/calendars/organization/{organization_id}`

Return a calendar of events for a single organization/club.

- Supports geospatial filtering via `?postalcode=` (5-digit US zip or 6-character Canadian postal code)
- Optional `radius` parameter — defaults to 300 miles
- Optional `country` parameter using ISO 3166-1 ALPHA-2 code (e.g. `US`, `CA`, `AU`)
- Optional `?archive=true` to include past events
- Optional `?start=` and `?end=` date parameters to filter overlapping events (e.g. `?start=2017-01-01&end=2018-01-01`)
- Optional `?exclude_cancelled=true` to remove cancelled events
- Optional `?types=x,y,z` to filter by comma-delimited `type_id` values

#### `GET /rest/calendars/organization/{organization_id}/type/{type_id}`

Return a calendar for a single organization/club for a single event type.

#### `GET /rest/events/{event_id}/entrylist`

Unauthenticated request returns the same data as the public entry list. Contents are controlled by the organizer and may return a limited or empty result set. For the full entry list, authenticate first and use the assignments resource.

---

### Requires OAuth Authentication

#### `POST /rest/tokens/request`

Obtain a request token to be used in directing users to the authorization URL at `https://www.motorsportreg.com/index.cfm/event/oauth`.

- Requires signing only, no authentication
- Per RFC 5849, response is returned in body as `application/x-www-form-urlencoded`

#### `POST /rest/tokens/access`

Exchange a request token for a permanent access token by passing the token and verifier code.

- Requires signing only, no authentication
- Per RFC 5849, response is returned in body as `application/x-www-form-urlencoded`

#### `GET /rest/me`

Return the profile and all organization memberships of the user whose OAuth token the request is made of. Helps identify organizations and their IDs for use in `X-Organization-Id` headers.

#### `GET /rest/me/vehicles`

Return a list of vehicles for the user whose OAuth token the request is made of.

#### `GET /rest/me/vehicles/{vehicle_id}`

Return a single vehicle for the user whose OAuth token the request is made of.

#### `GET /rest/me/events`

Return a list of event registrations for the user whose OAuth token the request is made of.

---

### Requires Authentication

#### `GET /rest/calendars`

All events from all calendars starting today or later (by default).

- Supports the same geospatial and date filtering parameters as the organization calendar endpoint above

#### `GET /rest/calendars/{event_id}`

Get details about a single event.

#### `GET /rest/calendars/venue/{venue_id}`

Return a calendar of events for a single venue (e.g. Laguna Seca, Road Atlanta).

#### `GET /rest/calendars/type/{type_id}`

Return a calendar of events for a single type of event (e.g. HPDE, Autocross, Rally).

#### `GET /rest/postalcodes/{postal_code}`

Return postal codes within 300 miles of the passed value. Optionally filter with `?radius=` to another value.

#### `GET /rest/events/{event_id}/attendees`

Authenticated request returns a complete list of attendees including all statuses, order and payment totals.

- `?fields=questions` — include questions in partial response
- `?fields=packages` — include packages in partial response
- `?registered_since=yyyy-mm-dd+10:00:00.000` — limit results by UTC timestamp
- `?lastupdate_since=yyyy-mm-dd+00:00:00.000` — limit results by last update timestamp
- `?precise_timestamps=true` — enable millisecond-level timestamp precision (recommended with `since` filters)

#### `GET /PUT /DELETE /rest/events/{event_id}/attendees/{attendee_id}`

Read, delete, or update status, notes and metadata for a single attendee.

- `?fields=questions` — include questions in partial response

#### `GET /PUT /POST /DELETE /rest/events/{event_id}/attendees/{attendee_id}/checkin`

Read, create, update or remove the check-in history and notes associated with an attendee.

#### Assignments

```
GET /rest/events/{event_id}/assignments
GET /rest/events/{event_id}/assignments/{assignment_id}
GET /rest/events/{event_id}/attendees/{attendee_id}/assignments
GET /rest/events/{event_id}/segments/{segment_id}/assignments
```

Authenticated request returns assignments (aka entries) including all statuses. Provides internal links to profiles and vehicles for more details.

- `?fields=team` — include co-drivers/teams
- `?fields=instructors` — include instructors
- `?fields=vehicle_questions` — include vehicle questions
- `?fields=modifications` — include vehicle modifications
- `?fields=flagtronics` — include Flagtronics ID
- `?fields=profile` — include contact information
- `?fields=profile_questions` — include contact information and profile question answers

#### `GET /rest/events/{event_id}/feeds/timing` _(JSON only)_

Return an array of changes to timing and scoring data (names, vehicles, transponders, classes, numbers). Use to relay changes from Registration to T&S operators.

- `?segments={segment_id,segment_id}` — filter by segments
- `?since=yyyy-mm-dd+00:00:00.000` — limit results by UTC timestamp

#### `GET /rest/events/{event_id}/segments/{segment_id}/feeds/timing` _(JSON only)_

Same as above but pre-filtered to a single segment. Use the `since` parameter to limit results.

#### `GET /rest/events/{event_id}/segments`

Return a list of segments with number, class, modifier and group options.

#### `GET /rest/members`

Return a list of all members.

- `?fields=questions` — include member questions
- `?imagesize=xx` — request a specific avatar image size (default: 80px square)
- `?email=you@domain.com` — search by email
- `?memberId=12345` — search by member number
- `?uniqueId=100000` — search by unique ID
- `?types=a,b,c` — filter by member type (see `/rest/members/types`)

#### `GET /rest/members/{member_id}`

Return a single member.

- `?fields=history` — include registration history
- `?fields=questions` — include member questions
- `?imagesize=xx` — request a specific avatar image size

#### `PUT /DELETE /rest/members/{member_id}`

Update or delete a member. Allowed fields: `memberId`, `memberEnd`, `status`.

- Pass an array of `types` to modify member types
- Pass an array of `questions` to update club/profile question answers (file/image uploads excluded)

#### `GET /rest/members/types`

Return a list of possible member types (may differ by organization).

> **Note:** The field `id` has been deprecated in favor of a new field: `guid`.

#### `GET /rest/profiles/{profile_id}`

Return a single profile and the corresponding `member_id`.

#### `GET /rest/members/{member_id}/vehicles`

Return a list of vehicles for a single profile. Optional `?fields=questions`.

#### `GET /rest/members/{member_id}/vehicles/{vehicle_id}`

Return a single vehicle for a single profile. Optional `?fields=questions`.

#### `GET /POST /rest/members/{member_id}/credits`

Return or create a payment credit for a member.

#### `PUT /DELETE /rest/members/{member_id}/credits/{credit_id}`

Update or delete a payment credit for a member.

#### `GET /rest/members/{member_id}/logbook`

Return a list of log book entries about a single profile.

#### `GET /rest/logbooks/types`

Return a list of log book entry types.

#### `POST /rest/logbooks`

Create a new log book entry.

#### `GET /PUT /DELETE /rest/logbooks/{logbook_entry_id}`

Return, update or delete a single log book entry.

#### `GET /PUT /DELETE /rest/discounts`

Return, update or delete discount codes. Search with `?code=YOURCODE`.

---

## HTTP Response Codes

| Code  | Meaning                                                      |
| ----- | ------------------------------------------------------------ |
| `200` | Success (successful GET or PUT)                              |
| `201` | Created (successful POST)                                    |
| `204` | Success (successful DELETE, no body)                         |
| `400` | Bad Request (improperly formatted request or invalid values) |
| `401` | Unauthorized (incorrect or missing credentials)              |
| `403` | Authorized but forbidden                                     |
| `404` | Resource Not Found                                           |
| `405` | Method Not Allowed                                           |
| `408` | Request Timeout                                              |
| `415` | Unsupported Media Type                                       |
| `500` | Application Error                                            |

- Successful `POST` requests return `201`, a `Location` header with the URI of the new resource, and usually the representation in the response body.
- Successful `PUT` requests return `200` and usually the representation in the response body.
- Successful `DELETE` requests return `204` with no body.

---

## Data Formats

If no format is specified, XML is the default — though JSON is recommended. The easiest way to specify a format is to include a file extension in the URL:

```
/rest/logbooks.json
/rest/discounts.xml
/rest/calendars/organization/{organization_id}.rss
```

Most resources also support an `Accept` header:

| Header Value                     | Format |
| -------------------------------- | ------ |
| `application/vnd.pukkasoft+xml`  | XML    |
| `application/vnd.pukkasoft+json` | JSON   |

Calendar resources additionally support:

| Header Value                         | Format           |
| ------------------------------------ | ---------------- |
| `application/vnd.pukkasoft+rss`      | RSS              |
| `application/vnd.pukkasoft+atom`     | Atom             |
| `application/vnd.pukkasoft+calendar` | iCalendar / .ics |

---

## Authorized Requests

All requests requiring authentication without valid credentials will be denied with a `401 Unauthorized` response.

### Basic Authentication

Pass a username and password using cURL:

```bash
curl -u username:password https://api.motorsportreg.com/rest/resource/etc
```

To do it manually, include an `Authorization` header with a Base64-encoded `username:password` string:

```
Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```

If credentials are correct but authorization is insufficient, the request will be denied with `403 Forbidden`.

---

## Data Compression

The API supports gzip/deflate compression. Signal this with a request header:

| Header            | Value          |
| ----------------- | -------------- |
| `Accept-Encoding` | `gzip,deflate` |

Your software will need to decompress the response (which may happen automatically). Especially useful for the full events feed, which can exceed several megabytes uncompressed.

---

## Testing and Debugging

[Postman](https://www.postman.com/) is recommended for structuring API calls and testing integrations. It also includes a browser-based Interceptor tool for debugging running applications. [cURL](https://curl.se/) is a flexible command-line alternative used in the examples below.

---

## Example Interactions

### cURL

**GET request:**

```bash
curl -u userid:password -X GET https://api.motorsportreg.com/rest/calendars.json
```

**GET with Organization ID header:**

```bash
curl -u userid:password -H "X-Organization-Id: {your-id-here}" \
    -X GET https://api.motorsportreg.com/rest/calendars.json
```

**POST (create a new resource):**

```bash
curl -u userid:password -d '<?xml version="1.0" encoding="UTF-8"?>XML Data' \
    -X POST https://api.motorsportreg.com/rest/calendars.json
```

**PUT (update an existing resource):**

```bash
curl -u userid:password -d '{JSON Data}' \
    -X PUT https://api.motorsportreg.com/rest/calendars/event_id.json
```

**DELETE:**

```bash
curl -u userid:password -X DELETE https://api.motorsportreg.com/rest/calendars/event_id.json
```

> **Note:** Deleting a resource may cascade to related resources (e.g. deleting an event also deletes its attendees).

**Tunneling PUT/DELETE through POST** (for libraries that don't support those methods):

```bash
curl -u userid:password -d '<?xml version="1.0" encoding="UTF-8"?>XML Data' \
    -X POST https://api.motorsportreg.com/rest/calendars.xml?_method=PUT
```

---

### PHP Sample

Fetches events as JSON and caches them locally. Requires the cURL extension.

```php
<?php
// Handles requesting and caching the JSON
function request_cache($url, $dest_file, $timeout, $flush = false)
{
    if (!file_exists($dest_file) || filemtime($dest_file) < (time()-$timeout) || $flush === TRUE)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

        $headers = array(
            "Accept: application/vnd.pukkasoft+json"
        );
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $data = curl_exec($ch);

        if (!curl_errno($ch) && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200)
        {
            $tmpf = tempnam('/tmp', 'motorsportreg-api-request');

            if (!$fp = fopen($tmpf, 'w')) {
                echo "Cannot open temporary file ($tmpf)";
                exit;
            }
            if (fwrite($fp, $data) === FALSE) {
                echo 'Failed to write data to file';
                exit;
            }
            fclose($fp);
            if (!rename($tmpf, $dest_file)) {
                echo 'Failed to rename temporary file to cache file!';
            }
        }
        elseif (file_exists($dest_file))
        {
            touch($dest_file, strtotime("+30 minutes", filemtime($dest_file)));
            $data = file_get_contents($dest_file);
        }
        else
        {
            echo "Unable to initialize event feed on first run.";
            $mock = array('response' => array('events' => array()));
            $data = json_encode($mock);
        }

        curl_close($ch);
        return $data;
    }
    else
    {
        return file_get_contents($dest_file);
    }
}

// URI to data, cached for 6 hours
$json = request_cache(URL_TO_THE_RESOURCE, './apimotorsportregcom.json', 21600);

$data = json_decode($json, true);
$events = $data["response"]["events"];

echo '<table>';
if (count($events))
{
    foreach ($events as $event)
    {
        $dte = strtotime($event["start"]);
        echo '<tr><td>' . date("m/d/y", $dte) . '</td>'
           . '<td><a href="' . $event["detailuri"] . '">' . $event["venue"]["name"] . '</a></td>'
           . '<td>' . $event["venue"]["city"] . ', ' . $event["venue"]["region"] . '</td></tr>';
    }
}
else
{
    echo '<tr><td colspan="3">No events matched your search!</td></tr>';
}
echo '</table>';
?>
```

**Providing an Organization ID with authentication in PHP:**

```php
$headers = array(
    "X-Organization-Id: {your-id-here}",
    "Authorization: Basic " . base64_encode('user:pass')
);
```

---

### JavaScript Sample (jQuery)

Displays a per-organization event calendar using JSONP:

```html
<html>
  <head>
    <title>MotorsportReg.com API Test</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
  </head>
  <body>
    <script>
      $(document).ready(function () {
        $.getJSON(
          "https://api.motorsportreg.com/rest/calendars/organization/{your-id-here}.jsonp?jsoncallback=?",
          {
            dataType: "jsonp",
            cacheBuster: new Date(),
          },
          function (json) {
            var tbl = "<table>";
            $.each(json.response.events, function (i, evt) {
              tbl += "<tr>";
              tbl +=
                '<td><a href="' + evt.detailuri + '">' + evt.name + "</a></td>";
              tbl += "<td>" + evt.type + "</td>";
              tbl +=
                "<td>" + evt.venue.city + ", " + evt.venue.region + "</td>";
              tbl += "<td>" + evt.start + "</td>";
              tbl += "<td>" + evt.end + "</td>";
              tbl +=
                "<td>" +
                (typeof evt.registration.start === "undefined"
                  ? ""
                  : evt.registration.start) +
                "</td>";
              tbl += "</tr>";
            });
            tbl += "</table>";
            $("#msrCalendar").append(tbl);
          },
        );
      });
    </script>

    <div id="msrCalendar"></div>
  </body>
</html>
```

---

### ColdFusion Sample

```cfml
<cfhttp username="user" password="password"
    url="https://api.motorsportreg.com/rest/calendars.json" method="get">
</cfhttp>

<!-- dump the entire results -->
<cfdump var="#cfhttp#" label="Full Dump" />

<!-- list just the event names -->
<cfset x = xmlSearch(xmlParse(cfhttp.FileContent), "/response/events/event/name/") />

<cfloop from="1" to="#arrayLen(x)#" index="ii">
    <cfoutput>#x[ii].xmlText#<br /></cfoutput>
</cfloop>
```

**With Organization ID header:**

```cfml
<cfhttp username="user" password="password"
    url="https://api.motorsportreg.com/rest/calendars.json" method="get">
    <cfhttpparam type="header" name="X-Organization-Id" value="{your-id-here}" />
</cfhttp>
```

---

### IFRAME Embed

For the per-organization calendar only (no authentication required). **Never embed your API key in a public web page.**

```html
<iframe
  src="https://api.motorsportreg.com/rest/calendars/organization/{your-id-here}.html"
  height="300"
  width="100%"
  style="border: 1px solid #ccc; margin: 10px 0;"
>
</iframe>
```

---

## RSS / Atom / iCalendar Feeds

The per-organization calendar is available in several common feed formats. These feeds are **not** designed for end-user consumption — retrieve, cache, and serve them from your own application.

```
https://api.motorsportreg.com/rest/calendars/organization/{your-id-here}.rss   (RSS 2.0)
https://api.motorsportreg.com/rest/calendars/organization/{your-id-here}.atom  (Atom 1.0)
https://api.motorsportreg.com/rest/calendars/organization/{your-id-here}.ics   (iCalendar)
```
