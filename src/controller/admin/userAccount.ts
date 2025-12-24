import { setAdminAuthToken } from "@/lib/authentication/adminAuth";
import { createInitialUsername, decryptJWTForPasswordResetWithToken, generateJWTForPasswordResetWithToken } from "@/lib/authentication/generalUtility";
import { generateGoogleOAuthPayloadForRequest, generateGoogleOAuthPayloadForVerification, generateJWTForUser } from "@/lib/authentication/userAuth";
import { hash, verifyHash } from "@/lib/crypto/hash";
import type { UserAccountService } from "@/services/userAccount";
import type { typeRegisterWithPassword } from "@/types/api/auth";
import type { typeCreateUserAccount, typeUpdateUserAccount } from "@/types/api/user";
import type { GoogleUserInfo } from "@/types/google/auth";
import type { PageProps, QueryProps } from "@/types/model/filter";
import type { ModelUserAccountCreate, ModelUserAccountUpdate } from "@/types/model/user";
import type { AstroCookies } from "astro";
import { PUBLIC_APP_URL } from "astro:env/client";


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

  public async loginWithPassword({env, emailOrUsername, password, astroCookies}: {env: Env, emailOrUsername: string, password: string, astroCookies: AstroCookies}) {
    const { data: userAccount, error: userAccountError} = await this.userAccountService.getByEmailOrUsername({env, emailOrUsername});
    if(userAccountError) {
      return Response.json({
        message: userAccountError || "Failed to login",
      }, {status: 500});
    }
    if(!userAccount) {
      return Response.json({
        message: "Invalid email/username or password",
      }, {status: 422});
    }
    const isPasswordValid = verifyHash(password, userAccount.password_hash);
    if(!isPasswordValid) {
      return Response.json({
        message: "Invalid username/email or password",
      }, {status: 422});
    }

    const jwtToken = await generateJWTForUser({userId: userAccount.id});
    if(!jwtToken){
      return Response.json({
        message: "Failed to generate authentication token",
      }, {status: 500});
    }

    // Set Cookie or Session here if needed

    return Response.json({
      message: "Login successful",
      data: {
        token: jwtToken,
        user: {
          id: userAccount.id,
          email: userAccount.email,
          username: userAccount.username,
          name: userAccount.name,
        }
      },
    });
  }

  public async loginRequestGoogle({env}: {env: Env}) {
    const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    const params = generateGoogleOAuthPayloadForRequest();
    console.log(params.get("redirect_uri"));
    return Response.json({
      message: "Google OAuth URL generated successfully",
      data: {
        url: `${googleAuthUrl}?${params.toString()}`
      }
    });
  }

  public async loginWithGoogle({env, code}: {env: Env, code?: string|null|undefined}) {
    if(!code){
      return Response.json({
        message: "Authorization code is missing",
      }, {status: 400});
    }
    const generatedVerificationPayload = generateGoogleOAuthPayloadForVerification({
      code,
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: generatedVerificationPayload,
    });

    if(!tokenResponse.ok){
      return Response.json({
        message: "Failed to verify Google OAuth token",
      }, {status: 400});
    }

    const tokenJson = await tokenResponse.json() as { id_token: string };

    if(!tokenJson.id_token){
      return Response.json({
        message: "ID token is missing in Google OAuth response",
      }, {status: 400});
    }

    let googleAuthPayload:GoogleUserInfo = null!;
    try{
      const payload = tokenJson.id_token.split('.')[1];
      googleAuthPayload = JSON.parse(atob(payload)) as GoogleUserInfo;
    }catch(e){
      return Response.json({
        message: "Failed to parse Google ID token",
        error: e,
      }, {status: 500});
    }
    
    const { data: userAccount, error: userAccountError} = await this.userAccountService.getByEmail({env, email: googleAuthPayload.email});
    if(userAccountError) {
      return Response.json({
        message: userAccountError || "Failed to login with Google",
      }, {status: 500});
    }
    
    // 3 step condition, user exist but without google id, user exist with google id and user not exist

    // Step 1: Check if user exist
    if(!userAccount){
      // Create new user account
      const toCreateData: ModelUserAccountCreate = {
        name: googleAuthPayload.name,
        // Username should be no special character, lowercase and minimum of 2 and maximum of 24 characters
        username: ("u" + Math.floor(Math.random()*1000).toString() + googleAuthPayload.name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0,24),
        email: googleAuthPayload.email,
        password_hash: "",
        google_id: googleAuthPayload.sub,
      };

      // Check first if username already exist
      // Recursive function to generate unique username
      const generateUniqueUsername = async (baseUsername: string, attempt: number): Promise<string> => {
        const usernameToCheck = attempt === 0 ? baseUsername : `${String.fromCharCode((attempt%26)+97)}${attempt}${baseUsername}`.slice(0,24);
        const {data: existingUser, error: getExistingError} = await this.userAccountService.get({env, queryProps: {
          filter:[{
            field: 'username',
            type: "in",
            values: [usernameToCheck],
          }]
        }});
        if(getExistingError){
          throw new Error(getExistingError);
        }
        if(existingUser && existingUser.totalItems > 0){
          return generateUniqueUsername(baseUsername, attempt + 1);
        }
        return usernameToCheck;
      }
      toCreateData.username = await generateUniqueUsername(toCreateData.username, 0);
      
      // Then should be okay to create
      const { data: createdUserAccount, error } = await this.userAccountService.create({env, userData: toCreateData});
      if(error || !createdUserAccount) {
        return Response.json({
          message: error || "Failed to create user account with Google",
        }, {status: 500});
      }

      // Generate Login Token
      const jwtToken = await generateJWTForUser({userId: createdUserAccount.id});

      // Generate Session Token

      return new Response(null, {
        status: 302,
        headers: { 'Location': PUBLIC_APP_URL }
      });
    }

    // Step 2: User exist, check google id
    if(!userAccount.google_id){
      // Update user account to add google id
      const { data: updatedUserAccount, error } = await this.userAccountService.update({env, id: userAccount.id, userData: {google_id: googleAuthPayload.sub}});
      if(error || !updatedUserAccount) {
        return Response.json({
          message: error || "Failed to link Google account",
        }, {status: 500});
      }
      // Proceed to login
      const jwtToken = await generateJWTForUser({userId: updatedUserAccount.id});

      // Generate Session Token
      
      return new Response(null, {
        status: 302,
        headers: { 'Location': PUBLIC_APP_URL }
      });
    }

    // Step 3: User exist with google id, proceed to login
    const jwtToken = await generateJWTForUser({userId: userAccount.id});
    // Generate Session Token

    return new Response(null, {
      status: 302,
      headers: { 'Location': PUBLIC_APP_URL }
    });
  }
  
  public async requestPasswordResetToken({env, email, urlLinkToSend}: {env: Env, email: string, urlLinkToSend: string}) {
    const {data:userAccount, error: userAccountError} = await this.userAccountService.getByEmail({env, email});
    if(userAccountError){
      return Response.json({
        message: userAccountError,
      }, {status: 500});
    }
    if(!userAccount){
      return Response.json({
        message: "User account with this email does not exist",
      }, {status: 404});
    }

    const { data:token, error: jwtError } = await generateJWTForPasswordResetWithToken({
      userId: userAccount.id,
      previousHash: userAccount.password_hash,
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

  public async resetPasswordWithToken({env, token, newPassword}: {env: Env, token: string, newPassword: string}) {
    const {data: tokenData, error: jwtError} = await decryptJWTForPasswordResetWithToken(token);
    if(jwtError){
      if(jwtError === "Token expired"){
        return Response.json({
          message: "Reset token has expired.",
        }, {status: 400});
      }
      return Response.json({
        message: jwtError,
      }, {status: 500});
    }
    if(tokenData === null || !tokenData.userId || !tokenData.previousHash){
      return Response.json({
        message: "Invalid reset token.",
      }, {status: 400});
    }

    const {data: userData, error: getUserError} = await this.userAccountService.getById({env, id: tokenData.userId});
    if(getUserError){
      return Response.json({
        message: getUserError,
      }, {status: 500});
    }
    if(!userData){
      return Response.json({
        message: "User not found",
      }, {status: 404});
    }

    if(tokenData.previousHash !== userData.password_hash){
      return Response.json({
        message: "Reset token is no longer valid.",
      }, {status: 400});
    }

    const newHashedPassword = await hash(newPassword);
    const {data: updatedUserData, error: updateUserError} = await this.userAccountService.update({env, id: userData.id, userData:{
      password_hash: newHashedPassword
    }});
    if(updateUserError){
      return Response.json({
        message: updateUserError,
      }, {status: 500});
    }

    return Response.json({
      message: "Password has been reset successfully",
      data: {...updatedUserData, password_hash: undefined},
    });
  }

  public async registerUserAccount({env, userData}: {env: Env, userData: typeRegisterWithPassword}) {
    const {data: previousAccounts, error: getPreviousError} = await this.userAccountService.get({env, queryProps: {
      filter: [{
        field: 'email',
        type: 'in',
        values: [userData.email],
      }]
    }});

    if(getPreviousError){
      return Response.json({
        message: getPreviousError,
      }, {status: 500});
    }

    if(previousAccounts && previousAccounts.totalItems > 0){
      return Response.json({
        message: "Email already registered",
      }, {status: 422});
    }

    const hashedPassword = await hash(userData.password);
    const toCreateData: ModelUserAccountCreate = {
      email: userData.email,
      username: createInitialUsername(),
      password_hash: hashedPassword,
      name: createInitialUsername(),
      google_id: null,
    };

    const { data: createdUserAccount, error } = await this.userAccountService.create({env, userData: toCreateData});
    if(error || !createdUserAccount) {
      return Response.json({
        message: error || "Failed to create user account",
      }, {status: 500});
    }

    const jwtToken = await generateJWTForUser({userId: createdUserAccount.id});
    if(!jwtToken){
      return Response.json({
        message: "Failed to generate authentication token",
      }, {status: 500});
    }

    return Response.json({
      message: "User account registered successfully",
      data: {
        token: jwtToken,
        user: {...createdUserAccount, password_hash: undefined}
      },
    });
  }
}