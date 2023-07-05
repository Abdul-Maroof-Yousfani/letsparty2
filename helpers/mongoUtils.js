// There are 2 possible situations that I can think of right now for
// this query builder to perform perfectly.
// First is to get the "db" object from Mongoose.connect callback.
// Second is to ask users to give us the collection as an arguement
// So, I can use those arguements in order to use functions.
// The second operation is a jugaad, So, It might conflict a little bit in
// future.
// I'm looking for a more flexible and innovative solution which can
// work in every situation and let my fellow programmers to use
// it with more ease. So, I guess I have to find a way around to extract
// "db" object from Mongoose.connect callback.
// Once, I get that I'll start working with the most common SQL queries.
// It will make our life more easier and let us unleash the power and speed of MongoDB
// with the ease of SQL queries.
// It will not let you write SQL queries for MongoDB. But instead it will provide
// some functions that you can use like JOIN, LEFT JOIN, FULL JOIN.
// It will also let you use sub queries.
import joins from 'array-join';
import _ from 'underscore';
import Mongoose from 'mongoose';
export const MongoUtil = (
    function () {
        var instance;

        return {
            /**
             * @param {*} dbo 
             * @returns {MongoUtils} Instantiates Singleton MongoUtils class
             */
            getInstance: function (dbo) {
                if (!instance) {
                    instance = new MongoUtils(dbo);
                }
                return instance;
            }
        };

    }
)();

class MongoUtils {
    #dbo = undefined;
    #result = undefined;
    #queue = undefined;
    constructor(dbo) {
        this.#dbo = dbo;
        this.#queue = Promise.resolve();
    }
    /**
     * @param {function} callback adds callback to the queue.
     */
    then(callback) {
        callback(this.#queue);
    }

    /**
     * @param {function} callback 
     * @returns {this.#queue} queue with your callback function.
     */
    #chain(callback) {
        return (this.#queue = this.#queue.then(callback));
    }
    /**
     * @param {string} id 
     * @returns {Boolean} validates MongoDB Id.
     */
    validateObjectId(id) {
        let valid = false;
        try {
            if (id == new Mongoose.Types.ObjectId("" + id))
                valid = true;

        }
        catch (e) {
            valid = false;
        }
        return valid;
    }
    /**
     * @param {string|Array} leftCollection Pass a collection array or collection name in string.
     * @param {string|Array} rightCollection Pass a collection array or collection name in string.
     * @param {string} leftField Pass a field name in string that you want to use on join condition as left parameter.
     * @param {string} rightField Pass a field name in string that you want to use on join condition as right parameter.
     * @param {{}} leftConditions pass mongodb conditions to filter your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightConditions pass mongodb conditions to filter your right collection. (will work only if you have passed rightCollection string)
     * @param {{}} leftProjection pass field names that you want to hide in your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightProjection pass field names that you want to hide in your right collection. (will work only if you have passed rightCollection string)
     * @param {string?} rightAs pass field name, if you want to give a name to your right collection items.
     * @param {string?} leftAs pass field name, if you want to give a name to your left collection items.
     * @returns {this} add all items of both array which match. Call value() afterwards if you don't want to use other chain functions.
     */
    join(
        leftCollection,
        rightCollection,
        leftField,
        rightField,
        leftConditions = {},
        rightConditions = {},
        leftProjection = {},
        rightProjection = {},
        rightAs,
        leftAs) {
        if (!leftCollection) throw new Error("leftCollection is undefined");

        if (!rightCollection) throw new Error("rightCollection is undefined");

        if (!leftField) throw new Error("leftField is undefined");

        if (!rightField) throw new Error("leftField is undefined");

        if(leftProjection) delete leftProjection[leftField];
        if(rightProjection) delete rightProjection[rightProjection];

        this.#chain(async () => {
            if (!Array.isArray(leftCollection)) {
                leftCollection = await this.#dbo.collection(leftCollection).find(leftConditions, { projection: leftProjection }).toArray();
            }

            if (!Array.isArray(rightCollection)) {
                rightCollection = await this.#dbo.collection(rightCollection).find(rightConditions, { projection: rightProjection }).toArray();
            }

            leftCollection = leftCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            rightCollection = rightCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            this.#result = joins.join(
                leftCollection,
                rightCollection,
                { key1: leftField, key2: rightField, leftAs, rightAs }
            );
        });
        return this;
    }

    /**
     * @param {string|Array} leftCollection Pass a collection array or collection name in string.
     * @param {string|Array} rightCollection Pass a collection array or collection name in string.
     * @param {string} leftField Pass a field name in string that you want to use on join condition as left parameter.
     * @param {string} rightField Pass a field name in string that you want to use on join condition as right parameter.
     * @param {{}} leftConditions pass mongodb conditions to filter your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightConditions pass mongodb conditions to filter your right collection. (will work only if you have passed rightCollection string)
     * @param {{}} leftProjection pass field names that you want to hide in your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightProjection pass field names that you want to hide in your right collection. (will work only if you have passed rightCollection string)
     * @param {string?} rightAs pass field name, if you want to give a name to your right collection items.
     * @param {string?} leftAs pass field name, if you want to give a name to your left collection items.
     * @returns {this} adds all items of left collection and merge right collections item that matches. Call value() afterwards if you don't want to use other chain functions.
     */
    leftJoin(
        leftCollection,
        rightCollection,
        leftField,
        rightField,
        leftConditions = {},
        rightConditions = {},
        leftProjection = {},
        rightProjection = {},
        rightAs,
        leftAs) {
        if (!leftCollection) throw new Error("leftCollection is undefined");

        if (!rightCollection) throw new Error("rightCollection is undefined");

        if (!leftField) throw new Error("leftField is undefined");

        if (!rightField) throw new Error("leftField is undefined");

        if(leftProjection) delete leftProjection[leftField];
        if(rightProjection) delete rightProjection[rightProjection];

        this.#chain(async () => {
            if (!Array.isArray(leftCollection)) {
                leftCollection = await this.#dbo.collection(leftCollection).find(leftConditions, { projection: leftProjection }).toArray();
            }

            if (!Array.isArray(rightCollection)) {
                rightCollection = await this.#dbo.collection(rightCollection).find(rightConditions, { projection: rightProjection }).toArray();
            }

            leftCollection = leftCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            rightCollection = rightCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            this.#result = joins.leftJoin(
                leftCollection,
                rightCollection,
                { key1: leftField, key2: rightField, leftAs, rightAs }
            );
        });
        return this;
    }
    /**
     * @param {string|Array} leftCollection Pass a collection array or collection name in string.
     * @param {string|Array} rightCollection Pass a collection array or collection name in string.
     * @param {string} leftField Pass a field name in string that you want to use on join condition as left parameter.
     * @param {string} rightField Pass a field name in string that you want to use on join condition as right parameter.
     * @param {{}} leftConditions pass mongodb conditions to filter your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightConditions pass mongodb conditions to filter your right collection. (will work only if you have passed rightCollection string)
     * @param {{}} leftProjection pass field names that you want to hide in your left collection. (will work only if you have passed leftCollection string)
     * @param {{}} rightProjection pass field names that you want to hide in your right collection. (will work only if you have passed rightCollection string)
     * @param {string?} rightAs pass field name, if you want to give a name to your right collection items.
     * @param {string?} leftAs pass field name, if you want to give a name to your left collection items.
     * @returns {this} adds all items from both arrays to the result, merging only ones that match. Call value() afterwards if you don't want to use other chain functions.
     */
    fullJoin(
        leftCollection,
        rightCollection,
        leftField,
        rightField,
        leftConditions = {},
        rightConditions = {},
        leftProjection = {},
        rightProjection = {},
        rightAs,
        leftAs) {
        if (!leftCollection) throw new Error("leftCollection is undefined");

        if (!rightCollection) throw new Error("rightCollection is undefined");

        if (!leftField) throw new Error("leftField is undefined");

        if (!rightField) throw new Error("leftField is undefined");

        if(leftProjection) delete leftProjection[leftField];
        if(rightProjection) delete rightProjection[rightProjection];

        this.#chain(async () => {
            if (!Array.isArray(leftCollection)) {
                leftCollection = await this.#dbo.collection(leftCollection).find(leftConditions, { projection: leftProjection }).toArray();
            }

            if (!Array.isArray(rightCollection)) {
                rightCollection = await this.#dbo.collection(rightCollection).find(rightConditions, { projection: rightProjection }).toArray();
            }

            leftCollection = leftCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            rightCollection = rightCollection.map(obj => {
                Object.keys(obj).map((key) => {
                    obj[key] = this.validateObjectId(obj[key]?.toString()) ? obj[key].toString() : obj[key];
                });
                return obj;
            });

            this.#result = joins.fullJoin(
                leftCollection,
                rightCollection,
                { key1: leftField, key2: rightField, leftAs, rightAs }
            );
        });
        return this;
    }
    /**
     * 
     * @param {{}} conditions pass an object of conditions just like you pass in mongodb. Check this documentation https://underscorejs.org/#where to know more about this function.
     * @returns {this} returns an array of filtered result based on conditions passed as parameter. Call value() afterwards if you don't want to use other chain functions.
     */
    where(conditions) {
        this.#chain(() => {
            if (this.#result === undefined || this.#result === null) throw new Error("Use a join first to filter results.");
            this.#result = _.where(this.#result, conditions);
        });
        return this;
    }
    /**
     * @param {string} fields pass space seperated string with field names from the result list to remove.
     * @returns {this} returns a list of objects without all the fields passed in fields parameter.
     */
    remove(fields) {
        this.#chain(() => {
            if (typeof fields !== "string") throw new Error("fields parameter must be a string");
            fields = fields.split(" ");
            fields.forEach(field => {
                this.#result = this.#result.map(res => {
                    delete res[field];
                    return res;
                });
            });
        });
        return this;
    }
    /**
     * @param {string|function} field pass a string field name or a callback if you want to use custom groupBy function. 
     * @param {string?} groupingField optional parameter, If you want to give a custom property name to your grouping field. 
     * @param {string} groupedFields optional parameter, If you want to give a custom property name to your grouped fields.
     * @returns {this} returns grouped data based on field parameter. Call value() afterwards if you don't want to use other chain functions.
     */
    groupBy(field, groupingField = "groupingField", groupedFields = "groupedFields") {
        this.#chain(() => {
            if (this.#result === undefined || this.#result === null) throw new Error("Use a join first to filter results");
            this.#result = _.chain(this.#result).groupBy(field).map(function (result, groupField) {
                var GroupedFields = _.map(result, function (it) {
                    return _.omit(it, field);
                });
                const obj = {};
                obj[groupingField] = groupField;
                obj[groupedFields] = GroupedFields;
                return obj;
            }).value();
        });
        return this;
    }
    /**
     * 
     * @param {string|function} property pass a string field or a callback if you want to use a custom sort function. 
     * @param {Number?} sortType optional paramter, Leave it empty if you want to sort list in ascending order. Pass -1 if you want to sort list in descending order.
     * @returns {this} Sorted array based on the parameters. Call value() afterwards if you don't want to use other chain functions
     */
    sort(property, sortType = 1) {
        this.#chain(() => {
            if (this.#result === undefined || this.#result === null) throw new Error("Use a join first to filter results");
            if ((typeof sortType !== "number")) throw new Error("SortType must be a number");
            this.#result = _.sortBy(this.#result, property);
            if (sortType < 0) {
                this.#result = this.#result.reverse();
            }
        });
        return this;
    }
    /**
     * @returns {Array} Returns a formatted array. Call this method at the end when you have performed all the other actions.
     */
    value() {
        return (this.#chain(() => this.#result));
    }
}