import re

# allowed tags and attributes
TAGS = {
    'a': ('href', 'name', 'target'),
    'p': ('style',),
    'ol': (),
    'ul': (),
    'li': (),
    'u': (),
    'em': (),
    'strong': (),
    'blockquote': (),
    'br': (),
    'h1': (),
    'h2': (),
    'h3': (),
    'h4': (),
    'h5': (),
    'h6': (),
    'pre': (),
    'address': (),
    'div': (),
    'span': ('style',),
    'img': ('align', 'alt', 'border', 'height', 'hspace', 'src', 'vspace',
            'width'),
    'table': ('border', 'cellpadding', 'cellspacing', 'style', 'summary'),
    'thead': (),
    'tr': (),
    'th': ('scope'),
    'caption': (),
    'tbody': (),
    'td': (),
    'hr': (),
}

NON_CLOSING = ('img', 'br', 'hr',)

OVERLAPPING = ('blockquote', 'span',)


# example to filter on "href" attribute of "a" tag
def a_href(data):
    for pattern in ('http://', 'ftp://', 'mailto:', '#'):
        if data.startswith(pattern):
            return data
    return u'#%s' % data
