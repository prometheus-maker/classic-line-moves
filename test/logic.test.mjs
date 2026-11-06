import assert from "node:assert/strict";
import { test } from "node:test";
import { indent, moveDown, moveUp, outdent } from "../build/logic.mjs";

const apply = (doc, e) => (e ? [...doc.slice(0, e.from), ...e.lines, ...doc.slice(e.to + 1)] : doc);

// The forum example (forum.obsidian.md/t/121617): two task groups separated by a blank line.
const groups = ["- [ ] Read", "- [ ] Work", "", "- [ ] Study 1. pom", "- [ ] Study 2. pom", "- [ ] Drink water"];

test("move down passes the blank line instead of pulling the next item up", () => {
	const e = moveDown(groups, 1, 1);
	assert.deepEqual(apply(groups, e), ["- [ ] Read", "", "- [ ] Work", "- [ ] Study 1. pom", "- [ ] Study 2. pom", "- [ ] Drink water"]);
	assert.equal(e.first, 2);
	const e2 = moveDown(apply(groups, e), 2, 2);
	assert.deepEqual(apply(apply(groups, e), e2).slice(2, 4), ["- [ ] Study 1. pom", "- [ ] Work"]);
});

test("a parent moves alone; its children stay in place", () => {
	const doc = ["- a", "- b", "\t- b1", "\t- b2", "- c"];
	assert.deepEqual(apply(doc, moveUp(doc, 1, 1)), ["- b", "- a", "\t- b1", "\t- b2", "- c"]);
	assert.deepEqual(apply(doc, moveDown(doc, 1, 1)), ["- a", "\t- b1", "- b", "\t- b2", "- c"]);
});

test("a selection of several lines moves as one block", () => {
	const doc = ["1", "2", "3", "4"];
	const e = moveUp(doc, 2, 3);
	assert.deepEqual(apply(doc, e), ["1", "3", "4", "2"]);
	assert.deepEqual([e.first, e.last], [1, 2]);
});

test("nothing happens at the top or bottom", () => {
	assert.equal(moveUp(["a", "b"], 0, 0), null);
	assert.equal(moveDown(["a", "b"], 1, 1), null);
});

test("indent and outdent change only the selected line, not its children", () => {
	const doc = ["- a", "- b", "\t- b1", "- c"];
	assert.deepEqual(apply(doc, indent(doc, 1, 1, "\t")), ["- a", "\t- b", "\t- b1", "- c"]);
	const nested = ["- a", "\t- b", "\t\t- b1"];
	assert.deepEqual(apply(nested, outdent(nested, 1, 1, 4)), ["- a", "- b", "\t\t- b1"]);
});

test("spaces: indent by the unit, outdent up to tab size; blank lines and top-level lines are left alone", () => {
	const doc = ["- a", "", "  - b", "      - c"];
	assert.deepEqual(apply(doc, indent(doc, 0, 1, "    ")), ["    - a", "", "  - b", "      - c"]);
	assert.deepEqual(apply(doc, outdent(doc, 2, 3, 4)), ["- a", "", "- b", "  - c"]);
	assert.equal(outdent(["- a"], 0, 0, 4), null);
});

test("cursor column follows the indent", () => {
	const e = indent(["- a"], 0, 0, "\t");
	assert.deepEqual(e.colShift, [1]);
	assert.deepEqual(outdent(["    - a"], 0, 0, 4).colShift, [-4]);
});
