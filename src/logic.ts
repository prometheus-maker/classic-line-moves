// Pure text logic, no Obsidian imports: unit-tested in test/logic.test.mjs.
// A selection is given by its line range [first, last] (0-based, inclusive). Every function returns the new text of
// the affected lines and the new line range, or null when nothing should happen (top/bottom of the note).

export interface LineEdit {
	/** first line that changes */
	from: number;
	/** last line that changes (inclusive) */
	to: number;
	/** replacement for lines from..to */
	lines: string[];
	/** where the selected lines are afterwards */
	first: number;
	last: number;
	/** shift of the cursor's column on each selected line (indent/outdent), 0 for moves */
	colShift: number[];
}

/** Move the selected lines one line up, as plain text: list children, blank lines and nesting are not touched. */
export function moveUp(doc: string[], first: number, last: number): LineEdit | null {
	if (first <= 0) return null;
	const block = doc.slice(first, last + 1);
	return {
		from: first - 1, to: last, lines: [...block, doc[first - 1]],
		first: first - 1, last: last - 1, colShift: block.map(() => 0),
	};
}

/** Move the selected lines one line down, as plain text. */
export function moveDown(doc: string[], first: number, last: number): LineEdit | null {
	if (last >= doc.length - 1) return null;
	const block = doc.slice(first, last + 1);
	return {
		from: first, to: last + 1, lines: [doc[last + 1], ...block],
		first: first + 1, last: last + 1, colShift: block.map(() => 0),
	};
}

/** Indent only the selected lines by one unit (a tab, or `tabSize` spaces), leaving their children where they are. */
export function indent(doc: string[], first: number, last: number, unit: string): LineEdit {
	const lines = doc.slice(first, last + 1).map((l) => (l.trim() === "" ? l : unit + l));
	return {
		from: first, to: last, lines, first, last,
		colShift: lines.map((l, i) => l.length - doc[first + i].length),
	};
}

/** Remove one indent unit from the start of each selected line: one tab, or up to `tabSize` spaces. */
export function outdent(doc: string[], first: number, last: number, tabSize: number): LineEdit | null {
	const lines = doc.slice(first, last + 1).map((l) => {
		if (l.startsWith("\t")) return l.slice(1);
		const spaces = l.length - l.trimStart().length;
		const lead = l.slice(0, spaces);
		const n = Math.min(tabSize, lead.length - lead.replace(/^ +/, "").length);
		return l.slice(n);
	});
	if (lines.every((l, i) => l === doc[first + i])) return null;
	return {
		from: first, to: last, lines, first, last,
		colShift: lines.map((l, i) => l.length - doc[first + i].length),
	};
}
