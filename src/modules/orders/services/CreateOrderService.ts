import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('This customer does not exists');

    const searchedProducts = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );

    if (searchedProducts.length !== products.length)
      throw new AppError('Send only existent products');

    const updatedProducts = await this.productsRepository.updateQuantity(
      products,
    );

    const orderedProducts = products.map(product => {
      const foundProduct = updatedProducts.find(
        updatedProduct => updatedProduct.id === product.id,
      );

      if (!foundProduct)
        return {
          product_id: product.id,
          quantity: product.quantity,
          price: 0,
        };

      return {
        product_id: product.id,
        quantity: product.quantity,
        price: foundProduct.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderedProducts,
    });

    return this.ordersRepository.formatOrder(order);
  }
}

export default CreateOrderService;
