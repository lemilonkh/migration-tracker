import { Link } from "@remix-run/react";
import { useState } from "react";

interface AutocompleteProps {
  items: any[];
  placeholder: string;
  titleKey?: string;
  idKey?: string;
}

export default function Autocomplete({
  items,
  placeholder,
  titleKey = "title",
  idKey = "id",
}: AutocompleteProps) {
  const [text, setText] = useState("");
  const [coincidences, setCoincidences] = useState<any[]>([]);

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setText(input);
    setCoincidences(items.filter((item) => (
      item[titleKey].toLowerCase().indexOf(input.toLowerCase()) > -1
    )));
  }

  return (
    <div className="w-full">
      {/* Search icon */}
      <div className="h-16 py-2 flex flex-row border-gray-300 border-y-[1px] px-4 outline-none items-stretch">
        <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="cat" className="my-auto mr-4 inline w-5 h-5" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/>
        </svg>
        <input
          className="form-control relative flex-auto min-w-0 my-1.5 block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          aria-label={placeholder}
          type="text"
          value={text}
          onChange={onTextChange}
          placeholder={placeholder}
        />
      </div>
      {coincidences.length > 0 && (
        <ul className="bg-white border-[1px] w-full shadow-lg max-h-[200px] overflow-y-auto">
          {coincidences.map((item) => (
            <Link to={`/migrations/place/${item[idKey]}`} key={item[idKey]}>
              <li className="min-h-10 w-full border-b-[1px] border-solid border-l-gray-300 py-2 hover:bg-blue-300 p-4">
                {item[titleKey]}
            </li>
          </Link>
          ))}
        </ul>
      )}
    </div>
  )
}
