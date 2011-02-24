_html_escape_table = {
	"&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    ">": "&gt;",
    "<": "&lt;",
}

def escape(text):
    return "".join(_html_escape_table.get(c,c) for c in text)
