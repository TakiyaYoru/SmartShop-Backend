export const typeDef = `
  type Category {
    _id: ID!
    name: String!
    description: String
    image: String
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  enum CategoriesOrderBy {
    ID_ASC
    ID_DESC
    NAME_ASC
    NAME_DESC
    CREATED_ASC
    CREATED_DESC
  }

  type CategoryConnection {
    nodes: [Category]
    totalCount: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input CategoryConditionInput {
    name: String
    isActive: Boolean
  }

  extend type Query {
    categories(
      first: Int = 10,
      offset: Int = 0,
      orderBy: CategoriesOrderBy = CREATED_DESC,
      condition: CategoryConditionInput
    ): CategoryConnection
    
    category(id: ID!): Category
    
    # Backward compatibility - simple list
    allCategories: [Category]
  }
  
  extend type Mutation {
    createCategory(input: CategoryInput!): Category
    updateCategory(id: ID!, input: CategoryInput!): Category
    deleteCategory(id: ID!): ID
  }
  
  input CategoryInput {
    name: String!
    description: String
    image: String
    isActive: Boolean = true
  }
`;

export const resolvers = {
  Query: {
    categories: async (parent, args, context, info) => {
      console.log('Categories query args:', args);
      const result = await context.db.categories.getAll(args);
      
      const { first = 10, offset = 0 } = args;
      const hasNextPage = offset + first < result.totalCount;
      const hasPreviousPage = offset > 0;
      
      return {
        nodes: result.items,
        totalCount: result.totalCount,
        hasNextPage,
        hasPreviousPage
      };
    },
    
    category: async (parent, args, context, info) => {
      return await context.db.categories.findById(args.id);
    },
    
    // Simple list for backward compatibility
    allCategories: async (parent, args, context, info) => {
      const result = await context.db.categories.getAllSimple();
      return result;
    },
  },
  
  Mutation: {
    createCategory: async (parent, args, context, info) => {
      return await context.db.categories.create(args.input);
    },
    updateCategory: async (parent, args, context, info) => {
      return await context.db.categories.updateById(args.id, args.input);
    },
    deleteCategory: async (parent, args, context, info) => {
      return await context.db.categories.deleteById(args.id);
    },
  },
};