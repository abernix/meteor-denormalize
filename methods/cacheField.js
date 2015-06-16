/**
 * @method collection.cacheField
 * @public
 * @param {String} cacheField The name of the cached field
 * @param {String[]} fields An array of field names that should be copied from the original document in the target collection
 * @param {Function} value A function that creates the new value. The function is called with two arguments:
 * @param {Object} value.doc The document that will be updated
 * @param {String[]} value.fields The watched fields
 * @returns {undefined}
 *
 * When a document in the collection is inserted/updated this denormalization updates the cached field with a value based on the same document
 */
Mongo.Collection.prototype.cacheField = function(cacheField, fields, value) {
	if(value === undefined) {
		value = Denormalize.fieldsJoiner();
	}

	check(fields, [String]);
	check(cacheField, String);
	check(value, Function);

	var collection = this;

	//Update the cached field after insert
	collection.after.insert(function(userId, doc) {
		var self = this;
		var fieldNames = _.keys(doc);
		Meteor.defer(function() {
			if(_.intersection(fieldNames, fields).length) {
				var $set = {};
				$set[cacheField] = value(doc, fields);
				collection.update(doc._id, {$set: $set});
			}
		});
	});

	//Update the cached field if any of the watched fields are changed
	collection.after.update(function(userId, doc, fieldNames) {
		var self = this;
		Meteor.defer(function() {
			if(_.intersection(fieldNames, fields).length) {
				var $set = {};
				$set[cacheField] = value(doc, fields);
				collection.update(doc._id, {$set: $set});
			}
		});
	});

}
