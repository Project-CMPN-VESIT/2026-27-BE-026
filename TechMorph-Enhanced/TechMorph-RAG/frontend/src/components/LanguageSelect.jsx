export const LANGUAGES = ["Hindi", "Marathi", "Telugu"];
export default function LanguageSelect({ value, onChange }) {
  return <label className="language-select-label"><span>Translate into</span><select value={value} onChange={(event) => onChange(event.target.value)}>{LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>;
}
