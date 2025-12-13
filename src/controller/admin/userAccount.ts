import { hash } from "@/lib/crypto/hash";
import type { UserAccountService } from "@/services/userAccount";
import type { typeCreateUserAccount, typeUpdateUserAccount } from "@/types/api/user";
import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ModelUserAccount, ModelUserAccountCreate, ModelUserAccountUpdate } from "@/types/model/user";


export class UserAccountController {
  constructor(
    public userAccountService: UserAccountService,
  ){}

  public async getAllUserAccounts({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}) {
    const { data: userAccounts, error } = await this.userAccountService.get({env, queryProps, pageProps});
    if(error) {
      return Response.json({
        message: error || "No user accounts found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: pageProps?.page || 1,
        limit: pageProps?.limit || 10,
      }, {status: 422});
    }
    return Response.json({
      message: "User accounts retrieved successfully",
      data: userAccounts,
    });
  }

  public async getUserAccountById({env, id}: {env: Env, id: string}) {
    const { data: userAccount, error } = await this.userAccountService.getById({env, id});
    if(error) {
      return Response.json({
        message: error || "User account not found",
        data: null,
      }, {status: 500});
    }
    if(!userAccount) {
      return Response.json({
        message: "User account not found",
        data: null,
      }, {status: 404});
    }
    return Response.json({
      message: "User account retrieved successfully",
      data: userAccount,
    });
  }

  public async createUserAccount({env, userData}: {env: Env, userData: typeCreateUserAccount}) {
    const toCreateData: ModelUserAccountCreate = {...userData, password_hash:"", google_id: null};
    // Avoid duplicate email and username
    if(userData.email){
      const {data: existingUser, error: getExistingError} = await this.userAccountService.get({env, queryProps: {
        filter:[{
          field: 'email',
          type: "in",
          values: [userData.email],
        }]
      }});
      if(getExistingError){
        return Response.json({
          message: getExistingError,
        }, {status: 500});
      }
      if(existingUser && existingUser.totalItems > 0){
        return Response.json({
          message: "Email already exists",
        }, {status: 422});
      }
    }
    if(userData.username){
      const {data: existingUser, error: getExistingError} = await this.userAccountService.get({env, queryProps: {
        filter:[{
          field: 'username',
          type: "in",
          values: [userData.username],
        }]
      }});
      if(getExistingError){
        return Response.json({
          message: getExistingError,
        }, {status: 500});
      }
      if(existingUser && existingUser.totalItems > 0){
        return Response.json({
          message: "Username already exists",
        }, {status: 422});
      }
    }

    if(userData.password){
      const hashedPassword = await hash(userData.password);
      toCreateData.password_hash = hashedPassword;
    }
    const { data: createdUserAccount, error } = await this.userAccountService.create({env, userData: toCreateData});
    if(error) {
      return Response.json({
        message: error || "Failed to create user account",
      }, {status: 500});
    }
    return Response.json({
      message: "User account created successfully",
      data: createdUserAccount,
    });
  }

  public async updateUserAccount({env, id, userData}: {env: Env, id: string, userData: typeUpdateUserAccount}) {
    const toUpdateData: ModelUserAccountUpdate = {...userData};
    
    // check data to avoid duplicate email and username
    if(userData.email){
      const {data: existingUser, error: getExistingError} = await this.userAccountService.get({env, queryProps: {
        filter:[{
          field: 'email',
          type: "in",
          values: [userData.email],
        }]
      }});
      if(getExistingError){
        return Response.json({
          message: getExistingError,
        }, {status: 500});
      }
      if(existingUser && existingUser.totalItems > 0){
        return Response.json({
          message: "Email already exists",
        }, {status: 422});
      }
    }
    if(userData.username){
      const {data: existingUser, error: getExistingError} = await this.userAccountService.get({env, queryProps: {
        filter:[{
          field: 'username',
          type: "in",
          values: [userData.username],
        }]
      }});
      if(getExistingError){
        return Response.json({
          message: getExistingError,
        }, {status: 500});
      }
      if(existingUser && existingUser.totalItems > 0){
        return Response.json({
          message: "Username already exists",
        }, {status: 422});
      }
    }
  
    if(userData.password){
      const hashedPassword = await hash(userData.password);
      toUpdateData.password_hash = hashedPassword;
    }


    const { data: updatedUserAccount, error } = await this.userAccountService.update({env, id, userData});
    if(error) {
      return Response.json({
        message: error || "Failed to update user account",
      }, {status: 500});
    }
    return Response.json({
      message: "User account updated successfully",
      data: updatedUserAccount,
    });
  }

  public async deleteUserAccount({env, id}: {env: Env, id: string}) {
    const { data: deletedUserAccount, error } = await this.userAccountService.delete({env, id});
    if(error) {
      return Response.json({
        message: error || "Failed to delete user account",
      }, {status: 500});
    }
    return Response.json({
      message: "User account deleted successfully",
      data: deletedUserAccount,
    });
  }
}