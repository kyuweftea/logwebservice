> :warning: Running this app exposes the host's filesystem under '/var/log' to the network with no encryption! Please take necessary precautions!

# logwebservice
This package is a proof-of-concept for a web service that provides access to files under the host's `/var/log` directory.

## Setup

1. Clone this repo `git clone https://github.com/kyuweftea/logwebservice.git`
2. Run the app `npm start`

## Usage

[Postman](https://www.postman.com/) is the recommended way to send requests to the app, though any method of sending HTTP GET requests and showing the JSON responses will suffice.

1. Download [Postman](https://www.postman.com/)
2. Send an HTTP GET request with a URL like `http://localhost:3000/varlog/` (if sending a request to a different machine, replace `localhost` with its IP address)
3. The response contains links to files and directories contained under the hosts's `/var/log`. Click on the links to open a new postman tab pre-populated with a GET request to that resource. Requests to directories will respond with their contents, and requests to files will respond with their last 10 lines by default.
4. Add query params to customize the log file lines in the response. Increase the maximum number of lines returned by specifying an integer for `max_line_count`, and filter the lines by specifying a regex (represented as a URL-encoded string) for `filter_regex`. See examples below.

## Future work

- access control
- SSL
- pagination
- configuration for which files to expose
- browser UI

## Examples

### Get contents of `/var/log`
#### Request
`GET http://localhost:3000/varlog/`
#### Response
```
{
    "logfiles": [
        {
            "resource": "/varlog/foo.log"
        },
        {
            "resource": "/varlog/bar.log"
        }
    ],
    "subdirs": [
        {
            "resource": "/varlog/one"
        },
        {
            "resource": "/varlog/two"
        }
    ]
}
```

### Get contents of subdirectory
#### Request
`GET http://localhost:3000/varlog/one/baz`
#### Response
```
{
    "logfiles": [
        {
            "resource": "/varlog/one/baz/example.log"
        }
    ],
    "subdirs": []
}
```

### Get most recent lines from log file
#### Request
`GET http://localhost:3000/varlog/install.log`
#### Response
```
{
    "lines": [
        "2023-07-15 16:40:39-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System has powered on",
        "2023-07-15 16:40:39-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System has powered on",
        "2023-07-15 17:15:07-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System is considering sleep",
        "2023-07-15 17:15:07-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System is considering sleep",
        "2023-07-15 17:15:37-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will sleep",
        "2023-07-15 17:15:37-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will sleep",
        "2023-07-15 17:35:03-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System has powered on",
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System has powered on"
    ]
}
```

### Limit line count to 3
#### Request
`GET http://localhost:3000/varlog/install.log?max_line_count=3`

If `max_line_count` is not specified, the default value is `10`.
#### Response
```
{
    "lines": [
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System has powered on",
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System has powered on"
    ]
}
```

### Filter lines
#### Request
`GET http://localhost:3000/varlog/install.log?filter_regex=will%20power%20on`

The app will decode the URL-encoded string `will%20power%20on` to `"will power on"`, and then interpret it as a regular expression `/will power on/`, and only lines containing substrings that match the expression will be shown. If `filter_regex` is not specified, the default regex is `/.*/`, which any string matches.
#### Response
```
{
    "lines": [
        "2023-07-14 18:56:52-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-14 18:56:52-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 15:27:31-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 15:27:32-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 15:42:18-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 15:42:18-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 16:40:38-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 16:40:38-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on"
    ]
}
```

### Filter lines and limit line count to 3
#### Request
`GET http://localhost:3000/varlog/install.log?max_line_count=3&filter_regex=will%20power%20on`
#### Response
```
{
    "lines": [
        "2023-07-15 16:40:38-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP SoftwareUpdateNotificationManager[1240]: SUOSUPowerEventObserver: System will power on",
        "2023-07-15 17:35:03-04 Philips-MBP softwareupdated[508]: SUOSUPowerEventObserver: System will power on"
    ]
}
```
