export const typeDef = `
  type Brand {
    _id: ID!
    name: String!
    slug: String!
    description: String
    logo: String
    banner: String
    website: String
    country: String
    foundedYear: Int
    categories: [Category]
    isActive: Boolean
    isFeatured: Boolean
    seoTitle: String
    seoDescription: String
    createdAt: String
    updatedAt: String
  }

  enum BrandsOrderBy {
    ID_ASC
    ID_DESC
    NAME_ASC
    NAME_DESC
    FOUNDED_ASC
    FOUNDED_DESC
    CREATED_ASC
    CREATED_DESC
  }

  type BrandConnection {
    nodes: [Brand]
    totalCount: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input BrandConditionInput {
    name: String
    country: String
    categories: [ID]
    isActive: Boolean
    isFeatured: Boolean
  }

  extend type Query {
    brands(
      first: Int = 10,
      offset: Int = 0,
      orderBy: BrandsOrderBy = CREATED_DESC,
      condition: BrandConditionInput
    ): BrandConnection
    
    brand(id: ID, slug: String): Brand
    brandByName(name: String!): Brand
    brandsByCategory(categoryId: ID!): [Brand]
    allBrands: [Brand]
    featuredBrands: [Brand]
  }
  
  extend type Mutation {
    createBrand(input: BrandInput!): Brand
    updateBrand(id: ID!, input: BrandInput!): Brand
    deleteBrand(id: ID!): ID
  }
  
  input BrandInput {
    name: String!
    description: String
    logo: String
    banner: String
    website: String
    country: String
    foundedYear: Int
    categories: [ID]
    isActive: Boolean = true
    isFeatured: Boolean = false
    seoTitle: String
    seoDescription: String
  }
`;

export const resolvers = {
  Query: {
    brands: async (parent, args, context, info) => {
      console.log('Brands query args:', args);
      const result = await context.db.brands.getAll(args);
      
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
    
    brand: async (parent, args, context, info) => {
      if (args.id) {
        return await context.db.brands.findById(args.id);
      }
      if (args.slug) {
        return await context.db.brands.findBySlug(args.slug);
      }
      throw new Error('Either id or slug must be provided');
    },
    
    brandByName: async (parent, args, context, info) => {
      return await context.db.brands.findByName(args.name);
    },
    
    brandsByCategory: async (parent, args, context, info) => {
      return await context.db.brands.getByCategory(args.categoryId);
    },
    
    allBrands: async (parent, args, context, info) => {
      return await context.db.brands.getAllSimple();
    },
    
    featuredBrands: async (parent, args, context, info) => {
      return await context.db.brands.getFeatured();
    },
  },
  
  Mutation: {
    createBrand: async (parent, args, context, info) => {
      try {
        console.log('Creating brand with input:', args.input);
        
        const { name } = args.input;
        
        if (!name) {
          throw new Error('Missing required field: name');
        }

        const existingBrand = await context.db.brands.findByName(name);
        if (existingBrand) {
          throw new Error('Brand name already exists');
        }

        if (args.input.categories && args.input.categories.length > 0) {
          for (const categoryId of args.input.categories) {
            const categoryExists = await context.db.categories.findById(categoryId);
            if (!categoryExists) {
              throw new Error(`Category with ID ${categoryId} not found`);
            }
          }
        }

        const brand = await context.db.brands.create(args.input);
        console.log('Brand created successfully:', brand._id);
        
        return brand;
      } catch (error) {
        console.error('Error creating brand:', error);
        throw error;
      }
    },
    
    updateBrand: async (parent, args, context, info) => {
      try {
        console.log('Updating brand:', args.id, 'with input:', args.input);
        
        const existingBrand = await context.db.brands.findById(args.id);
        if (!existingBrand) {
          throw new Error('Brand not found');
        }

        if (args.input.name && args.input.name !== existingBrand.name) {
          const brandWithSameName = await context.db.brands.findByName(args.input.name);
          if (brandWithSameName && brandWithSameName._id.toString() !== args.id) {
            throw new Error('Brand name already exists');
          }
        }

        if (args.input.categories && args.input.categories.length > 0) {
          for (const categoryId of args.input.categories) {
            const categoryExists = await context.db.categories.findById(categoryId);
            if (!categoryExists) {
              throw new Error(`Category with ID ${categoryId} not found`);
            }
          }
        }

        const brand = await context.db.brands.updateById(args.id, args.input);
        console.log('Brand updated successfully:', brand._id);
        
        return brand;
      } catch (error) {
        console.error('Error updating brand:', error);
        throw error;
      }
    },
    
    deleteBrand: async (parent, args, context, info) => {
      try {
        console.log('Deleting brand:', args.id);
        
        const existingBrand = await context.db.brands.findById(args.id);
        if (!existingBrand) {
          throw new Error('Brand not found');
        }

        const productsUsingBrand = await context.db.products.getByBrand(args.id);
        if (productsUsingBrand && productsUsingBrand.length > 0) {
          throw new Error(`Cannot delete brand. ${productsUsingBrand.length} products are using this brand.`);
        }

        const deletedId = await context.db.brands.deleteById(args.id);
        console.log('Brand deleted successfully:', deletedId);
        
        return deletedId;
      } catch (error) {
        console.error('Error deleting brand:', error);
        throw error;
      }
    },
  },
};