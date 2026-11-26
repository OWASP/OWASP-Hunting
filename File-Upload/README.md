# File Upload Vulnerabilities

## Description
File upload vulnerabilities occur when a web application allows users to upload files without properly validating the file type, content, or destination. Attackers can exploit these vulnerabilities to upload malicious files, leading to remote code execution (RCE), arbitrary file read/write, cross-site scripting (XSS), and other attacks.

## Common Attack Vectors
- Profile picture upload
- Document upload features
- Resume/CV upload
- Image galleries
- File sharing functionality
- Import/export features
- Backup/restore functionality
- Plugin/theme upload (CMS)
- Attachment features

## Testing Approach
Test various file upload bypasses:
- Extension bypasses (double extensions, case variations, null bytes)
- Content-Type manipulation
- Magic byte manipulation
- Polyglot files (valid image + valid code)
- Archive file manipulation (zip, tar)
- Path traversal in filenames
- File overwrite attacks
- XXE via SVG/XML files

## Risk Impact
- **Remote Code Execution (RCE)** - Upload and execute web shells
- **Cross-Site Scripting (XSS)** - Upload HTML/SVG files with JavaScript
- **Path Traversal** - Overwrite critical files
- **Denial of Service** - Upload large files, zip bombs
- **Information Disclosure** - Read sensitive files
- **Defacement** - Overwrite web pages
- **Malware Distribution** - Host malicious files

## Common Vulnerable Patterns
- Blacklist-based file type validation (instead of whitelist)
- Client-side only validation
- Inadequate Content-Type checking
- Missing magic byte validation
- Predictable upload paths
- Executable permissions on upload directories
- Lack of file size limits
- No antivirus scanning

## File Extensions to Test
**Web Shells & RCE:**
- PHP: `.php`, `.php3`, `.php4`, `.php5`, `.php7`, `.phtml`, `.phar`, `.phpt`, `.pgif`, `.pht`
- ASP: `.asp`, `.aspx`, `.asa`, `.asax`, `.ascx`, `.ashx`, `.asmx`, `.cer`, `.config`
- JSP: `.jsp`, `.jspx`, `.jsw`, `.jsv`, `.jspf`
- Perl: `.pl`, `.pm`, `.cgi`, `.lib`
- Python: `.py`, `.pyc`, `.pyw`
- Ruby: `.rb`, `.rbw`
- Other: `.shtml`, `.shtm`, `.phar`, `.inc`

**Script Files:**
- `.js`, `.vbs`, `.bat`, `.cmd`, `.ps1`, `.sh`

**Server Config:**
- `.htaccess`, `.htpasswd`, `.web.config`, `.conf`

## Payloads
See `file-upload-payloads.txt` for comprehensive payloads including:
- Extension bypass techniques
- Content-Type bypasses
- Magic byte manipulation
- Polyglot file examples
- Web shell payloads (PHP, ASP, JSP)
- XSS via file upload
- Path traversal in filenames
- XXE via SVG/XML uploads
- Archive-based attacks

## Additional Payloads
See `processing-storage-payloads.txt` for filename/MIME variants, archive generators, processing inputs and storage authorization requests. Select the section matching the target input context. Use disposable files and storage fixtures; verify processing results and access controls with the documented test accounts.
