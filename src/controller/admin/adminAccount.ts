import { generateJWTForAdmin, setAdminAuthInformation, setAdminAuthToken } from "@/lib/authentication/adminAuth";
import { decryptJWTForPasswordResetWithToken, generateJWTForPasswordResetWithToken } from "@/lib/authentication/generalUtility";
import { hash, verifyHash } from "@/lib/crypto/hash";
import type { AdminAccountService } from "@/services/adminAccount";
import type { PageProps, QueryProps } from "@/types/model/filter";
import type { AstroCookies } from "astro";

export class AdminAccountController {
  constructor(
    public adminAccountService: AdminAccountService,
  ){}

  public async loginWithPassword({env, email, password, astroCookies}: {env: Env, email: string, password: string, astroCookies: AstroCookies}) {
    const {data: userData, error} = await this.adminAccountService.getByEmail({env, email});
    if(error){
      return Response.json({
        message: error,
      }, {status: 500});
    }
    if(!userData){
      return Response.json({
        message: "Invalid email or password",
      }, {status: 404});
    }
    
    const isVerify = await verifyHash(password, userData.password_hash);
    if(!isVerify){
      return Response.json({
        message: "Invalid email or password",
      }, {status: 401});
    }

    const jwtToken = await generateJWTForAdmin({userId: userData.id});
    if(!jwtToken){
      return Response.json({
        message: "Failed to generate authentication token",
      }, {status: 500});
    }

    // Set Cookie or Session here if needed
    setAdminAuthToken(astroCookies, jwtToken);
    setAdminAuthInformation(astroCookies, {
      id: userData.id,
      email: userData.email,
    });

    return Response.json({
      message: "Login successful",
      data: {
        token: jwtToken,
        user: {
          id: userData.id,
          email: userData.email,
        }
      }
    });
  }

  public async resetPasswordWithToken({env, token, newPassword}: {env: Env, token: string, newPassword: string}) {
    const {data: tokenData, error: jwtError} = await decryptJWTForPasswordResetWithToken(token);


    if(jwtError){
      if(jwtError === "Token expired"){
        return Response.json({
          message: "Reset token has expired",
        }, {status: 401});
      }

      return Response.json({
        message: jwtError,
      }, {status: 500});
    }
    if(!tokenData){
      return Response.json({
        message: "Invalid reset token",
      }, {status: 400});
    }

    if(!tokenData.userId){
      return Response.json({
        message: "Invalid reset token",
      }, {status: 400});
    }

    const {data: userData, error: getUserDataError} = await this.adminAccountService.getById({env, id: tokenData.userId});
    if(getUserDataError){
      return Response.json({
        message: getUserDataError,
      }, {status: 500});
    }
    if(!userData){
      return Response.json({
        message: "User not found",
      }, {status: 404});
    }
    if(userData.password_hash !== tokenData.previousHash){
      return Response.json({
        message: "Reset token is no longer valid.",
      }, {status: 400});
    }

    const newHashedPassword = await hash(newPassword);
    const {data: updatedUserData, error: updateUserError} = await this.adminAccountService.update({env, id: userData.id, adminData:{
      password_hash: newHashedPassword
    }});

    if(updateUserError){
      return Response.json({
        message: updateUserError,
      }, {status: 500});
    }

    return Response.json({
      message: "Password has been reset successfully",
      data: updatedUserData,
    });
  }

  public async requestPasswordResetToken({env, email, urlLinkToSend}: {env: Env, email: string, urlLinkToSend: string}) {
    const {data: userData, error} = await this.adminAccountService.getByEmail({env, email});
    if(error){
      return Response.json({
        message: error,
      }, {status: 500});
    }
    if(!userData){
      return Response.json({
        message: "Admin account with this email does not exist",
      }, {status: 404});
    }
    const { data:token, error: jwtError } = await generateJWTForPasswordResetWithToken({
      userId: userData.id,
      previousHash: userData.password_hash,
    });
    if(jwtError){
      return Response.json({
        message: jwtError,
      }, {status: 500});
    }

    // Do email sending next time
    const urlWithToken = `${urlLinkToSend}?token=${token}&expiredIn=${new Date(Date.now() + 10*60*1000).toISOString()}`;

    return Response.json({
      message: "Password reset token generated successfully",
      data: { token },
    });
  }

  public async createAdminAccount({env, email, password}: {env: Env, email: string, password: string}) {
    // Avoid duplicate email
    const {data: existingAdmin, error: getExistingError} = await this.adminAccountService.getByEmail({env, email});
    if(getExistingError){
      return Response.json({
        message: getExistingError,
      }, {status: 500});
    }
    if(existingAdmin){
      return Response.json({
        message: "Admin account with this email already exists",
      }, {status: 400});
    }

    const passwordHash = await hash(password);
    const {data, error} = await this.adminAccountService.create({env, adminData:{
      email,
      password_hash: passwordHash
    }});
    if(error){
      return Response.json({
        message: error,
      }, {status: 500});
    }
    return Response.json({
      message: "Admin account created successfully",
      data,
    });
  }

  public async getAccountList({env, queryProps, pageProps}: {env: Env, queryProps?: QueryProps, pageProps?: PageProps}) {
    const { data: adminAccounts, error } = await this.adminAccountService.get({env, queryProps, pageProps});
    if(error) {
      return Response.json({
        message: error || "No admin accounts found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        page: pageProps?.page || 1,
        limit: pageProps?.limit || 10,
      }, {status: 500});
    }

    return Response.json({
      message: "Admin accounts retrieved successfully",
      data: adminAccounts,
    });
  }

  public async getAccountById({env, id}: {env: Env, id: string}) {
    const { data: adminAccount, error } = await this.adminAccountService.getById({env, id});
    if(error) {
      return Response.json({
        message: error || "Admin account not found",
        data: null,
      }, {status: 500});
    }
    if(!adminAccount) {
      return Response.json({
        message: "Admin account not found",
        data: null,
      }, {status: 404});
    }
    // To remove password_hash before returning
    const { password_hash, ...cleanedAdminAccount } = adminAccount;
    return Response.json({
      message: "Admin account retrieved successfully",
      data: cleanedAdminAccount,
    });
  }

  public async deleteAccount({env, id}: {env: Env, id: string}) {
    const { data, error } = await this.adminAccountService.delete({env, id});
    if(error) {
      return Response.json({
        message: error || "Failed to delete admin account",
      }, {status: 500});
    }
    if(!data) {
      return Response.json({
        message: "Admin account not found",
      }, {status: 404});
    }
    return Response.json({
      message: "Admin account deleted successfully",
      data,
    });
  }


}