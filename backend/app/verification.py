"""Existence-checks for user-supplied contact details.

Used at Heritage Guide registration to reject phone numbers and email
addresses that are obviously not real, so a visitor never waits on contact
details that cannot work.

    1. Phone: must be a valid 10-digit Indian mobile number (series 6-9).
    2. Email: format valid AND the mail domain resolves to a real MX
       record (domain accepts mail). Domains on the disposable list are
       rejected outright, and domains that do not exist / expose no mail
       exchange are rejected.
"""
import re

import dns.resolver

_MOBILE_RE = re.compile(r"^[6789]\d{9}$")

# Well-known disposable / throwaway mail providers. Registration requests
# using one of these are rejected because the address cannot be relied on.
DISPOSABLE_DOMAINS = frozenset({
    "mailinator.com", "mailinator.net", "mailinator.org", "mailinator.io",
    "temp-mail.org", "tempmail.com", "tempail.com", "tempmailo.com",
    "guerrillamail.com", "guerrillamail.net", "grr.la", "guerrillamailblock.com",
    "yopmail.com", "yopmail.fr", "yopmail.net", "yopmail.org",
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "throwawaymail.com", "throwawayemail.com",
    "maildrop.cc", "mailnesia.com", "mintemail.com",
    "inboxbear.com", "getnada.com", "nada.email", "emailfake.com",
    "dispostable.com", "trashmail.com", "trashmail.de",
    "sharklasers.com", "guerrillamail.info", "spam4.me",
    "mailmetrash.com", "meltmail.com", "fake-mail.net",
    "burnermail.io", "discard.email", "maileater.com",
    "mytemp.email", "tempinbox.com", "emailondeck.com",
})


def is_valid_indian_mobile(phone: str) -> bool:
    """True when ``phone`` is a plausible real Indian mobile number: exactly
    10 digits, starting with the licensed consumer-loop prefix 6, 7, 8 or 9.
    """
    return bool(_MOBILE_RE.match(phone))


def _resolve_mx(domain: str) -> bool:
    """Return True when the domain can receive mail.

    A domain publishing an MX record can receive mail; per RFC 5321 a domain
    with only an A/AAAA record is also a valid mail destination, so that is
    accepted as a fallback. A definitive "domain does not exist" answer
    returns False (the address is treated as not existing). Transient DNS
    failures resolve to True so an unrelated network glitch does not lock
    genuine applicants out.
    """
    try:
        answers = dns.resolver.resolve(domain, "MX", lifetime=8)
        return len(answers) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        pass
    except Exception:
        return True

    try:
        dns.resolver.resolve(domain, "A", lifetime=8)
        return True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        return False
    except Exception:
        return True


def email_domain_exists(email: str) -> bool:
    """True when the email's domain is a real, disposable-free mail domain."""
    try:
        domain = (email or "").rsplit("@", 1)[1].strip().strip(".").lower()
    except IndexError:
        return False
    if not domain or "." not in domain:
        return False
    if domain in DISPOSABLE_DOMAINS:
        return False
    return _resolve_mx(domain)