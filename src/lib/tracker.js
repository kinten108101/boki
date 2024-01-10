import Tracker from 'gi://Tracker';

/**
 * @param {Tracker.SparqlCursor} cursor
 */
export const sparql_unpack_value = (cursor) => {
	/**
	 * @param {number} column_index
	 */
	return (column_index) => {
		const type = cursor.get_value_type(column_index);
		switch (type) {
		case Tracker.SparqlValueType.BOOLEAN:
			return cursor.get_boolean(column_index);
		case Tracker.SparqlValueType.DATETIME:
			return cursor.get_datetime(column_index);
		case Tracker.SparqlValueType.DOUBLE:
			return cursor.get_double(column_index);
		case Tracker.SparqlValueType.INTEGER:
			return cursor.get_integer(column_index);
		case Tracker.SparqlValueType.STRING:
			return cursor.get_string(column_index)[0];
		default:
			return null;
		}
	};
};
