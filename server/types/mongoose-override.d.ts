// Type overrides for Mongoose to fix compilation issues
declare module 'mongoose' {
  interface Document {
    [key: string]: any;
  }
  
  interface Model<T> {
    find(...args: any[]): any;
    findOne(...args: any[]): any;
    findById(...args: any[]): any;
    findOneAndUpdate(...args: any[]): any;
    findByIdAndUpdate(...args: any[]): any;
    findByIdAndDelete(...args: any[]): any;
    create(...args: any[]): any;
    deleteOne(...args: any[]): any;
    updateOne(...args: any[]): any;
  }
}
