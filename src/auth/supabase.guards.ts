import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase') {
  getRequest(context: ExecutionContext) {
    const type = context.getType<'http' | 'graphql' | 'ws'>();

    if (type === 'http') {
      return context.switchToHttp().getRequest();
    }

    // if (type === 'graphql') {
    //   const gqlCtx = GqlExecutionContext.create(context);
    //   return gqlCtx.getContext().req; // assumes you attach req to GQL context
    // }

    // Optional: support WebSockets if you need it
    if (type === 'ws') {
      const client = context.switchToWs().getClient();
      return client?.handshake || client?.request; // depending on your gateway
    }

    // Fallback
    return context.switchToHttp().getRequest();
  }
}
