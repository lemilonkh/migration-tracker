interface RoundedListProps<T> {
  entries: T[];
  emptyText: string;
  renderEntry: (entry: T) => React.ReactElement,
  getEntryId: (entry: T) => any,
  itemClassName: string;
}

export default function RoundedList<T>(props: RoundedListProps<T>) {
  return (props.entries.length === 0 ? <p>{props.emptyText}</p> : (
    <ul className="bg-white rounded-lg border border-gray-200 w-full lg:max-w-lg text-gray-900">
      {props.entries.map((entry, i) => (
        <li
          key={props.getEntryId(entry)}
          className={`${props.itemClassName} px-6 py-2 border-b border-gray-200 w-full ${i === 0 ? 'rounded-t-lg' : ''} ${i === props.entries.length - 1 ? 'rounded-b-lg' : ''}`}
        >
          {props.renderEntry(entry)}
        </li>
      ))}
    </ul>
  ));
}