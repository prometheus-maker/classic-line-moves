// The Obsidian glue (selection range, one transaction, selection follows the text) against a small fake Editor
// that applies changes the way Obsidian's Editor.transaction does.
import assert from "node:assert/strict";
import { test } from "node:test";
import { apply, docLines, lineRange } from "../build/editor-ops.mjs";
import { indent, moveDown, moveUp } from "../build/logic.mjs";

function fakeEditor(text, anchor, head = anchor) {
	const e = {
		lines: text.split("\n"), anchor, head, transactions: 0,
		lineCount: () => e.lines.length,
		getLine: (n) => e.lines[n],
		getCursor(which) {
			const [a, h] = [e.anchor, e.head];
			const before = a.line < h.line || (a.line === h.line && a.ch <= h.ch);
			return { anchor: a, head: h, from: before ? a : h, to: before ? h : a }[which ?? "head"];
		},
		transaction({ changes, selection }) {
			e.transactions++;
			for (const c of changes) {
				const head = e.lines.slice(0, c.from.line);
				const first = e.lines[c.from.line].slice(0, c.from.ch);
				const last = e.lines[c.to.line].slice(c.to.ch);
				const mid = (first + c.text + last).split("\n");
				e.lines = [...head, ...mid, ...e.lines.slice(c.to.line + 1)];
			}
			e.anchor = selection.from;
			e.head = selection.to ?? selection.from;
		},
	};
	return e;
}

const run = (ed, op, delta, ...args) => {
	const doc = docLines(ed);
	const [a, b] = lineRange(ed);
	apply(ed, doc, op(doc, a, b, ...args), delta);
};

test("move down: one undo step, cursor stays on the moved line at the same column", () => {
	const ed = fakeEditor("- [ ] Read\n- [ ] Work\n\n- [ ] Study", { line: 1, ch: 10 });
	run(ed, moveDown, 1);
	assert.deepEqual(ed.lines, ["- [ ] Read", "", "- [ ] Work", "- [ ] Study"]);
	assert.deepEqual(ed.head, { line: 2, ch: 10 });
	assert.equal(ed.transactions, 1);
});

test("a full-line selection ending at column 0 of the next line moves only the selected lines", () => {
	const ed = fakeEditor("a\nb\nc\nd", { line: 1, ch: 0 }, { line: 3, ch: 0 });
	assert.deepEqual(lineRange(ed), [1, 2]);
	run(ed, moveUp, -1);
	assert.deepEqual(ed.lines, ["b", "c", "a", "d"]);
	assert.deepEqual([ed.anchor, ed.head], [{ line: 0, ch: 0 }, { line: 2, ch: 0 }]);
});

test("indent keeps the cursor on the same character", () => {
	const ed = fakeEditor("- a\n- b\n\t- b1", { line: 1, ch: 3 });
	run(ed, indent, 0, "\t");
	assert.deepEqual(ed.lines, ["- a", "\t- b", "\t- b1"]);
	assert.deepEqual(ed.head, { line: 1, ch: 4 });
});

test("at the top, nothing changes and nothing is added to undo", () => {
	const ed = fakeEditor("a\nb", { line: 0, ch: 1 });
	run(ed, moveUp, -1);
	assert.deepEqual(ed.lines, ["a", "b"]);
	assert.equal(ed.transactions, 0);
});
