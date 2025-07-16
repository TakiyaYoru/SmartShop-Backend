import _ from "lodash";

const mockData = {
  categories: [
    { id: 1, name: "Electronics", description: "Smart electronic devices" },
    { id: 2, name: "Smart Phones", description: "Latest smartphones" },
    { id: 3, name: "Laptops", description: "High-performance laptops" },
    { id: 4, name: "Smart Home", description: "IoT and smart home devices" },
    { id: 5, name: "Wearables", description: "Smartwatches and fitness trackers" },
  ],
};

const db = {
  categories: {
    getAll: () => mockData.categories,
    findById: (id) => mockData.categories.find((item) => item.id == id),
    deleteById: (id) => {
      const item = mockData.categories.find((item) => item.id == id);
      if (item) {
        _.remove(mockData.categories, (item) => item.id == id);
        return id;
      }
      return null;
    },
    create: (input) => {
      const id = mockData.categories.length + 1;
      const item = {
        id: id,
        name: input.name,
        description: input.description,
      };
      mockData.categories.push(item);
      return item;
    },
    updateById: (id, input) => {
      const index = mockData.categories.findIndex((item) => item.id == id);
      if (index >= 0) {
        Object.keys(input).map((key) => {
          const value = input[key];
          mockData.categories[index][key] = value;
        });
        return mockData.categories[index];
      }
      return null;
    },
  },
};

export { db };