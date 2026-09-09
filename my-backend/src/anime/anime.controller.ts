import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnimeService } from './anime.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Post('series')
  @UseGuards(JwtAuthGuard)
  async createSeries(@Body() dto: CreateSeriesDto, @Req() req: any) {
    return this.animeService.createSeries(dto, req.user.id);
  }

  @Get('series')
  async findAllSeries(@Query() query: { search?: string; category?: string }) {
    return this.animeService.findAllSeries(query);
  }

  @Get('categories')
  async getCategories() {
    return this.animeService.getCategories();
  }

  @Get('series/:id')
  async findSeriesById(@Param('id') id: string) {
    return this.animeService.findSeriesById(id);
  }

  @Patch('series/:id')
  @UseGuards(JwtAuthGuard)
  async updateSeries(@Param('id') id: string, @Body() dto: UpdateSeriesDto, @Req() req: any) {
    return this.animeService.updateSeries(id, dto, req.user.id, req.user.role);
  }

  @Delete('series/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSeries(@Param('id') id: string, @Req() req: any) {
    await this.animeService.deleteSeries(id, req.user.id, req.user.role);
    return { message: 'Series deleted successfully' };
  }

  @Post('episodes')
  @UseGuards(JwtAuthGuard)
  async createEpisode(@Body() dto: CreateEpisodeDto, @Req() req: any) {
    return this.animeService.createEpisode(dto, req.user.id);
  }

  @Get('series/:seriesId/episodes')
  async findEpisodesBySeries(@Param('seriesId') seriesId: string) {
    return this.animeService.findEpisodesBySeries(seriesId);
  }

  @Patch('episodes/:id')
  @UseGuards(JwtAuthGuard)
  async updateEpisode(@Param('id') id: string, @Body() dto: UpdateEpisodeDto, @Req() req: any) {
    return this.animeService.updateEpisode(id, dto, req.user.id);
  }

  @Delete('episodes/:id')
  @UseGuards(JwtAuthGuard)
  async deleteEpisode(@Param('id') id: string, @Req() req: any) {
    await this.animeService.deleteEpisode(id, req.user.id, req.user.role);
    return { message: 'Episode deleted successfully' };
  }

  @Post('episodes/:id/view')
  async incrementViews(@Param('id') id: string) {
    return this.animeService.incrementViews(id);
  }

  @Post('episodes/bulk')
  @UseGuards(JwtAuthGuard)
  async bulkCreateEpisodes(
    @Body() body: { seriesId: string; seasonNumber: number; episodes: Array<{ episodeNumber: number; videoUrl: string; thumbnailUrl?: string }> },
    @Req() req: any,
  ) {
    return this.animeService.bulkCreateEpisodes(body.seriesId, body.seasonNumber, body.episodes, req.user.id);
  }

  @Post('favorites')
  @UseGuards(JwtAuthGuard)
  async addToFavorites(@Body() body: { seriesId: string }, @Req() req: any) {
    return this.animeService.addToFavorites(req.user.id, body.seriesId);
  }

  @Delete('favorites/:seriesId')
  @UseGuards(JwtAuthGuard)
  async removeFromFavorites(@Param('seriesId') seriesId: string, @Req() req: any) {
    await this.animeService.removeFromFavorites(req.user.id, seriesId);
    return { message: 'Removed from favorites' };
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  async getFavorites(@Req() req: any) {
    return this.animeService.getFavorites(req.user.id);
  }

  @Post('playlists')
  @UseGuards(JwtAuthGuard)
  async createPlaylist(@Body() dto: CreatePlaylistDto, @Req() req: any) {
    return this.animeService.createPlaylist(req.user.id, dto);
  }

  @Get('playlists')
  @UseGuards(JwtAuthGuard)
  async findPlaylistsByUser(@Req() req: any) {
    return this.animeService.findPlaylistsByUser(req.user.id);
  }

  @Post('playlists/:playlistId/items')
  @UseGuards(JwtAuthGuard)
  async addToPlaylist(@Param('playlistId') playlistId: string, @Body() body: { seriesId: string }, @Req() req: any) {
    return this.animeService.addToPlaylist(playlistId, body.seriesId, req.user.id);
  }

  @Delete('playlists/:playlistId/items/:seriesId')
  @UseGuards(JwtAuthGuard)
  async removeFromPlaylist(@Param('playlistId') playlistId: string, @Param('seriesId') seriesId: string, @Req() req: any) {
    await this.animeService.removeFromPlaylist(playlistId, seriesId, req.user.id);
    return { message: 'Removed from playlist' };
  }

  @Get('playlists/:playlistId/items')
  @UseGuards(JwtAuthGuard)
  async getPlaylistItems(@Param('playlistId') playlistId: string, @Req() req: any) {
    return this.animeService.getPlaylistItems(playlistId, req.user.id);
  }

  @Post('watch-history')
  @UseGuards(JwtAuthGuard)
  async addWatchHistory(@Body() body: { episodeId: string; seriesId: string; progress?: number }, @Req() req: any) {
    return this.animeService.addWatchHistory(req.user.id, body.episodeId, body.seriesId, body.progress);
  }

  @Get('watch-history')
  @UseGuards(JwtAuthGuard)
  async getWatchHistory(@Req() req: any) {
    return this.animeService.getWatchHistory(req.user.id);
  }

  @Put('watch-history/:id')
  @UseGuards(JwtAuthGuard)
  async updateWatchHistory(@Param('id') id: string, @Body() body: { progress: number }, @Req() req: any) {
    return this.animeService.updateWatchHistory(id, body.progress, req.user.id);
  }

  @Delete('playlists/:id')
  @UseGuards(JwtAuthGuard)
  async deletePlaylist(@Param('id') id: string, @Req() req: any) {
    await this.animeService.deletePlaylist(id, req.user.id);
    return { message: 'Playlist deleted successfully' };
  }
}
