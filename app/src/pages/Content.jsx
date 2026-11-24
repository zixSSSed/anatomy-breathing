/* Страницы с текстом из src/pages/*.html: конспект, лекции, схемы, физиология.
   HTML готовится при сборке (build.py), поведение подключают модули из legacy/. */
import { CONTENT } from "../generated/content.js";
import { HtmlPage } from "../components/ui.jsx";
import { initNotes } from "../legacy/notes.js";
import { initLectures } from "../legacy/lectures.js";
import { initSchemes } from "../legacy/schemes.js";
import { initPhysiology } from "../legacy/physiology.js";
import { mountAlveolus } from "../legacy/illus.js";

const physiology = (root) => [initPhysiology(root), ...[...root.querySelectorAll("[data-alveolus]")].map(mountAlveolus)];

export function Notes() { return <HtmlPage html={CONTENT.notes} init={initNotes} />; }
export function Lectures() { return <HtmlPage html={CONTENT.lectures} init={initLectures} />; }
export function Schemes() { return <HtmlPage html={CONTENT.schemes} init={initSchemes} />; }
export function Physiology() { return <HtmlPage html={CONTENT.physiology} init={physiology} />; }
