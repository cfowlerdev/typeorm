import {RelationIdMetadataArgs} from "../metadata-args/RelationIdMetadataArgs";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {EntityMetadata} from "./EntityMetadata";
import {RelationMetadata} from "./RelationMetadata";

/**
 * Contains all information about entity's relation count.
 */
export class RelationIdMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata where this column metadata is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Relation from which ids will be extracted.
     */
    relation: RelationMetadata;

    /**
     * Relation name which need to count.
     */
    relationNameOrFactory: string|((object: any) => any);

    /**
     * Target class to which metadata is applied.
     */
    target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    propertyName: string;

    /**
     * Alias of the joined (destination) table.
     */
    alias?: string;

    /**
     * Extra condition applied to "ON" section of join.
     */
    queryBuilderFactory?: (qb: QueryBuilder<any>) => QueryBuilder<any>;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        args: RelationIdMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.relationNameOrFactory = options.args.relation;
        this.alias = options.args.alias;
        this.queryBuilderFactory = options.args.queryBuilderFactory;
    }

    // ---------------------------------------------------------------------
    // Public Builder Methods
    // ---------------------------------------------------------------------

    /**
     * Builds some depend relation id properties.
     * This builder method should be used only after entity metadata, its properties map and all relations are build.
     */
    build() {
        const propertyPath = this.relationNameOrFactory instanceof Function ? this.relationNameOrFactory(this.entityMetadata.propertiesMap) : this.relationNameOrFactory;
        const relation = this.entityMetadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Cannot find relation ${propertyPath}. Wrong relation specified for @RelationId decorator.`);

        this.relation = relation;
    }

}