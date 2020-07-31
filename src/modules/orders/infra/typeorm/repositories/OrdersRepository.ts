import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Customer from '@modules/customers/infra/typeorm/entities/Customer';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

interface IResponseOrderProduct {
  id: string;
  price: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public formatOrder(order: Order, customer: Customer): Order {
    const order_products: OrdersProducts[] = [];
    const newOrder = new Order();

    order.order_products.forEach(order_product => {
      const newOrderProduct = new OrdersProducts();

      Object.assign(newOrderProduct, {
        ...order_product,
        price: Number.parseFloat(order_product.price.toString()).toFixed(2),
      });

      delete newOrderProduct.order_id;

      order_products.push(newOrderProduct);
    });

    if (customer) Object.assign(order, { customer });

    Object.assign(newOrder, {
      ...order,
      order_products,
    });

    delete newOrder.customer_id;

    return newOrder;
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const orderProducts = products.map(product => {
      const orderProduct = new OrdersProducts();

      Object.assign(orderProduct, product);

      return orderProduct;
    });

    const order = this.ormRepository.create({
      customer,
      order_products: orderProducts,
    });

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne(id, {
      relations: ['order_products'],
    });

    return order;
  }
}

export default OrdersRepository;
