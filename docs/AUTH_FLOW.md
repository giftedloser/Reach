# Authentication Flow

## Design Philosophy

The authentication flow is designed to be **linear** and **deterministic**. There are no background retry loops or heuristic guessing games.

## Logic Path (`fetch_feed_winhttp`)

1.  **Step 1: Initial GET (Implicit/IWA)**
    - Request: `GET /RDWeb/Feed/webfeed.aspx`
    - Auth: AutoLogon allowed (IWA).
    - Result:
      - `200 OK` (Feed XML) -> Success.
      - `200 OK` (HTML Login Page) -> Detects Forms Auth. Proceed to Step 2.
      - `401 Unauthorized` -> Failure. (Propagates to UI).

2.  **Step 2: Forms Authentication (Explicit)**
    - _Triggered only if Step 1 returns a login page AND credentials were provided._
    - Action: Parse HTML for `__VIEWSTATE` and hidden fields.
    - Request: `POST /RDWeb/Pages/en-US/login.aspx`
    - Payload: `UserName`, `Password`, hidden fields.
    - Result: `302 Found` or `200 OK`.

3.  **Step 3: Post-Login Fetch**
    - Request: `GET /RDWeb/Feed/webfeed.aspx` (with cookies from Step 2).
    - Result:
      - `200 OK` (Feed XML) -> Success.
      - `200 OK` (Login Page) -> **Failure** (Credentials likely invalid).
      - Other -> Failure.

## UI Behavior

- **"AuthRequired"**: If the backend detects a login page but has no credentials, it returns this specific error code.
- **Prompt**: The frontend (`UnifiedAddDialog`) catches this and reveals the Username/Password fields, prompting the user to "retry" by entering credentials (which then flows into Step 2).
