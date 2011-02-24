import re
from collections import defaultdict

from src.support.htmlfilter import rules

attrs_re = re.compile(r"""\s*(\w+)\s*=\s*(["'])(.*?)(?<!\\)\2""", re.DOTALL)


class HTMLFilter:
    """Simple HTML white list filter.

    Usage:
        hf = HTMLFilter()
        filtered_html = hf.filter(html)

    The filter parses the code for < and > characters.
    It tries to correct malformed tags and close them.

    Use it with a WYSIWYG editor on the client side
    to convert user's < and > inputs into &lt; and &gt;

    For the tough stuff, prefer BeautifulSoup.

    """

    def __init__(self, rules=rules):
        # default config
        self.rules = rules

        # other tags and attributes are removed
        self.allowed = hasattr(rules, 'TAGS') and rules.TAGS or {}

        # <tag />
        self.non_closing = hasattr(rules, 'NON_CLOSING') and rules.NON_CLOSING or []

        # <blockquote><blockquote></blockquote></blockquote>
        self.overlapping = hasattr(rules, 'OVERLAPPING') and rules.OVERLAPPING or []

    def filter(self, data):
        # reset
        self.filtered_data = filtered_data = []
        self.open_tags = open_tags = defaultdict(int)
        handle_data = self.handle_data

        chunks = data.split('<')
        filtered_data.append(chunks.pop(0))

        for chunk in chunks:
            handle_data(chunk)

        # close open tags
        for tag, times in open_tags.iteritems():
            for i in xrange(times):
                filtered_data.extend(['</', tag, '>'])

        return ''.join(self.filtered_data)

    def handle_data(self, chunk):
        if chunk:
            if '>' in chunk:
                tagdata, text = chunk.split('>', 1)
            else:
                # the tag didn't end
                tagdata, text = chunk, ''

            self.handle_tag(tagdata)
            self.filtered_data.append(text)

    def handle_tag(self, tagdata):
        attrs = tagdata.strip().split(' ', 1)
        tag = attrs.pop(0).lower()
        if tag:
            if tag[0] == '/':
                self.handle_endtag(tag[1:])
            else:
                if attrs:
                    # find the attributes
                    attrs = [(a[0], a[2]) for a in attrs_re.findall(attrs[0])]
                self.handle_starttag(tag, attrs)

    def handle_starttag(self, tag, attrs):
        if tag in self.allowed:
            # open tags check
            if tag in self.non_closing:
                tag_tail = ' /'
            else:
                if tag not in self.overlapping and self.open_tags[tag] > 0:
                    self.handle_endtag(tag)
                self.open_tags[tag] += 1
                tag_tail = ''

            # filter attributes
            filtered_attrs = {}
            for attr, val in attrs:
                if attr in self.allowed[tag]:
                    filterfn = "%s_%s" % (tag, attr)
                    if hasattr(self.rules, filterfn):
                        val = getattr(self.rules, filterfn)(val)
                    if val:
                        filtered_attrs[attr] = val

            self.filtered_data.extend(
                                ['<',
                                 tag,
                                 filtered_attrs and ' ' or '',
                                 ' '.join(['%s="%s"' % (k, v)
                                           for (k, v)
                                           in filtered_attrs.iteritems()]),
                                 tag_tail,
                                 '>'
                                 ])

    def handle_endtag(self, tag):
        if tag in self.allowed and self.open_tags[tag] > 0 \
           and tag not in self.non_closing:
            self.filtered_data.extend(['</', tag, '>'])
            self.open_tags[tag] -= 1
            
def sanitize(html, rules=rules):
    return HTMLFilter(rules).filter(html.strip())
