import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {JoinOptions} from "./JoinOptions";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryBuilderUtils} from "./QueryBuilderUtils";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {Alias} from "./Alias";

/**
 * Stores all join attributes which will be used to build a JOIN query.
 */
export class JoinAttribute {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Join direction.
     */
    direction: "LEFT"|"INNER";

    /**
     * Alias of the joined (destination) table.
     */
    alias: Alias;

    /**
     * Joined table, entity target, or relation in "post.category" format.
     */
    entityOrProperty: Function|string;

    /**
     * Extra condition applied to "ON" section of join.
     */
    condition?: string;

    /**
     * Property + alias of the object where to joined data should be mapped.
     */
    mapToProperty?: string;

    /**
     * Indicates if user maps one or many objects from the join.
     */
    isMappingMany?: boolean;

    /**
     * Extra join options.
     */
    options?: JoinOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection,
                private queryExpressionMap: QueryExpressionMap,
                private joinAttribute?: JoinAttribute) {
        Object.assign(this, joinAttribute || {});
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    get isMany(): boolean {
        if (this.isMappingMany !== undefined)
            return this.isMappingMany;

        if (this.relation)
            return this.relation.isManyToMany || this.relation.isOneToMany;

        return false;
    }

    /**
     * Name of the table which we should join.
     */
    get tableName(): string {
        return this.metadata ? this.metadata.tableName : this.entityOrProperty as string;
    }

    /**
     * Alias of the parent of this join.
     * For example, if we join ("post.category", "categoryAlias") then "post" is a parent alias.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get parentAlias(): string|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        return this.entityOrProperty.substr(0, this.entityOrProperty.indexOf("."));
    }

    /**
     * Relation property name of the parent.
     * This is used to understand what is joined.
     * For example, if we join ("post.category", "categoryAlias") then "category" is a relation property.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get relationPropertyPath(): string|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        return this.entityOrProperty.substr(this.entityOrProperty.indexOf(".") + 1);
    }

    /**
     * Relation of the parent.
     * This is used to understand what is joined.
     * This is available when join was made using "post.category" syntax.
     * Relation can be undefined if entityOrProperty is regular entity or custom table.
     */
    get relation(): RelationMetadata|undefined {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;

        const relationOwnerSelection = this.queryExpressionMap.findAliasByName(this.parentAlias!);
        const metadata = relationOwnerSelection.metadata.parentEntityMetadata
            ? relationOwnerSelection.metadata.parentEntityMetadata
            : relationOwnerSelection.metadata;
        const relation = metadata.findRelationWithPropertyPath(this.relationPropertyPath!);
        if (!relation)
            throw new Error(`Relation with property path ${this.relationPropertyPath} in entity was not found.`);
        return relation;
    }

    /**
     * Metadata of the joined entity.
     * If table without entity was joined, then it will return undefined.
     */
    get metadata(): EntityMetadata|undefined {

        // entityOrProperty is Entity class
        if (this.entityOrProperty instanceof Function)
            return this.connection.getMetadata(this.entityOrProperty);

        // entityOrProperty is relation, e.g. "post.category"
        if (this.relation)
            return this.relation.inverseEntityMetadata;

        if (typeof this.entityOrProperty === "string") { // entityOrProperty is a custom table

            // first try to find entity with such name, this is needed when entity does not have a target class,
            // and its target is a string name (scenario when plain old javascript is used or entity schema is loaded from files)
            const metadata = this.connection.entityMetadatas.find(metadata => metadata.name === this.entityOrProperty);
            if (metadata)
                return metadata;

            // check if we have entity with such table name, and use its metadata if found
            return this.connection.entityMetadatas.find(metadata => metadata.tableName === this.entityOrProperty);
        }

        return undefined;
    }

    /**
     * Generates alias of junction table, whose ids we get.
     */
    get junctionAlias(): string {
        if (!this.relation)
            throw new Error(`Cannot get junction table for join without relation.`);

        return this.relation.isOwning ? this.parentAlias + "_" + this.alias.name : this.alias.name + "_" + this.parentAlias;
    }

    get mapToPropertyParentAlias(): string|undefined {
        if (!this.mapToProperty)
            return undefined;

        return this.mapToProperty!.split(".")[0];
    }

    get mapToPropertyPropertyName(): string|undefined {
        if (!this.mapToProperty)
            return undefined;

        return this.mapToProperty!.split(".")[1];
    }

}